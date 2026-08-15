import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { db } from './db';
import { ensureAdminAuthTable } from './db-schema';
import { hashPassword, verifyPassword } from './password';

/**
 * Admin access: a username and a password.
 *
 * The password can live in two places, checked in this order:
 *
 *  1. The `admin_auth` row, if the operator has changed their password from
 *     the panel. Stored as a scrypt hash, so the panel can change it but can
 *     never show it.
 *  2. ADMIN_PASSWORD (or the older ADMIN_TOKEN) in the hosting environment.
 *     This is the bootstrap credential and the fallback when there is no
 *     database.
 *
 * IMPORTANT: once a password is set from the panel, delete ADMIN_PASSWORD and
 * ADMIN_TOKEN from the host. Otherwise both work, and the env one would come
 * back if the database were ever unreachable. The panel says so after a change.
 *
 * The rules that are not negotiable:
 *
 *  - No password anywhere means the panel is DISABLED, never open. An unset
 *    secret must not compare equal to an empty submission.
 *  - A short password is treated as unset. A six-character secret on a public
 *    URL is brute-forced in minutes.
 *  - Username and password are always both compared, in constant time, so
 *    response timing cannot confirm the username on its own.
 *  - The password NEVER goes in the cookie. The cookie carries a signed
 *    session, so a stolen cookie cannot be read back into the password, and
 *    changing the password invalidates every existing session for free.
 */

export const ADMIN_COOKIE = 'ma-admin';

/** Deliberately shorter than a random token: this is meant to be typed. */
export const MIN_ADMIN_PASSWORD_LENGTH = 12;
const SESSION_HOURS = 12;

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  // timingSafeEqual throws on a length mismatch, so lengths are checked first.
  // The length of the secret is not itself sensitive.
  return x.length === y.length && timingSafeEqual(x, y);
}

function envPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN;
  return value && value.length >= MIN_ADMIN_PASSWORD_LENGTH ? value : null;
}

function envUsername(): string {
  return process.env.ADMIN_USERNAME?.trim() || 'admin';
}

interface AdminCredentials {
  username: string;
  /** HMAC key for session cookies. Changes whenever the password changes. */
  signingKey: string;
  verify(password: string): Promise<boolean>;
  /** True when the password came from the database rather than the env. */
  managed: boolean;
}

/**
 * Resolves the active credentials. Cached per request, so a page that checks
 * `isAdmin()` several times still makes one round trip.
 */
export const adminCredentials = cache(async (): Promise<AdminCredentials | null> => {
  const sql = db();

  if (sql) {
    try {
      await ensureAdminAuthTable(sql);
      const rows = (await sql`
        SELECT username, password_hash FROM admin_auth WHERE id = 1
      `) as unknown as { username: string; password_hash: string }[];

      const row = rows[0];
      if (row) {
        return {
          username: row.username,
          // The hash is high-entropy and never leaves the server, so it makes a
          // sound signing key — and rotating the password rotates it.
          signingKey: row.password_hash,
          verify: (password) => verifyPassword(password, row.password_hash),
          managed: true,
        };
      }
    } catch {
      // Fall through to the environment. A database blip must not lock the
      // operator out of their own panel.
    }
  }

  const password = envPassword();
  if (!password) return null;

  return {
    username: envUsername(),
    signingKey: password,
    verify: async (candidate) => safeEqual(candidate, password),
    managed: false,
  };
});

export async function adminConfigured(): Promise<boolean> {
  return (await adminCredentials()) !== null;
}

/**
 * Checks a submitted username and password.
 *
 * Both comparisons always run — no `&&` short circuit — so a correct username
 * with a wrong password takes as long as a wrong username, and an attacker
 * cannot confirm the username separately.
 */
export async function checkCredentials(username: string, password: string): Promise<boolean> {
  const creds = await adminCredentials();
  if (!creds) return false;

  const userOk = safeEqual(username.trim().toLowerCase(), creds.username.toLowerCase());
  const passOk = await creds.verify(password);
  return userOk && passOk;
}

/**
 * Replaces the admin password.
 *
 * Returns the new hash — which is also the new session signing key — so the
 * caller can immediately mint a valid session. Returns null when there is no
 * database: the env credential cannot be rewritten from here, only from the
 * host.
 */
export async function setAdminPassword(
  username: string,
  password: string
): Promise<string | null> {
  const sql = db();
  if (!sql) return null;

  const hash = await hashPassword(password);
  await ensureAdminAuthTable(sql);
  await sql`
    INSERT INTO admin_auth (id, username, password_hash, updated_at)
    VALUES (1, ${username}, ${hash}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      username      = EXCLUDED.username,
      password_hash = EXCLUDED.password_hash,
      updated_at    = NOW()
  `;
  return hash;
}

/* ---- sessions: `payload.signature`, signed with the credential above ---- */

interface AdminSession {
  /** Expiry, seconds since epoch. Inside the signed payload, so unforgeable. */
  exp: number;
}

function sign(body: string, key: string): string {
  return createHmac('sha256', key).update(body).digest('base64url');
}

/**
 * Signs a session with a specific key.
 *
 * Needed straight after a password change: adminCredentials() is cached for
 * the duration of the request and would still hand back the OLD key, so the
 * cookie it produced would be rejected on the very next request. The caller
 * passes the new key explicitly instead of hoping the cache has caught up.
 */
export function createSessionForKey(key: string): string {
  const payload: AdminSession = {
    exp: Math.floor(Date.now() / 1000) + SESSION_HOURS * 60 * 60,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body, key)}`;
}

export async function createAdminSession(): Promise<string | null> {
  const creds = await adminCredentials();
  return creds ? createSessionForKey(creds.signingKey) : null;
}

export async function isValidSession(cookie: string | undefined | null): Promise<boolean> {
  const creds = await adminCredentials();
  if (!creds || !cookie) return false;

  const [body, signature] = cookie.split('.');
  if (!body || !signature) return false;
  if (!safeEqual(signature, sign(body, creds.signingKey))) return false;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AdminSession;
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/** True when the current request carries a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(ADMIN_COOKIE)?.value);
}

export const adminCookieOptions = {
  httpOnly: true, // never readable by client JavaScript
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const, // not sent on cross-site requests, so no CSRF
  path: '/',
  maxAge: SESSION_HOURS * 60 * 60,
};
