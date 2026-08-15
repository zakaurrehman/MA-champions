import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Admin access: a username and a password held in the hosting environment.
 *
 * There is one operator, so there is no admin user table — the credentials live
 * in env vars where only someone with the hosting account can change them.
 * Proportionate, but only as good as these rules, so they are not negotiable:
 *
 *  - No password set means the panel is DISABLED, never open. An unset secret
 *    must not compare equal to an empty submission.
 *  - A short password is treated as unset. A six-character secret on a public
 *    URL is brute-forced in minutes.
 *  - Both fields are compared in constant time, and both are always compared,
 *    so response timing cannot reveal the username or the password.
 *  - The password NEVER goes in the cookie. The cookie carries a signed session
 *    instead, so a stolen cookie cannot be read back into the password, and
 *    changing the password invalidates every existing session for free.
 */

export const ADMIN_COOKIE = 'ma-admin';

/** Deliberately shorter than a random token: this is meant to be typed. */
const MIN_PASSWORD_LENGTH = 12;
const SESSION_HOURS = 12;

/** ADMIN_TOKEN is the original name for this secret; still honoured. */
function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN;
  return value && value.length >= MIN_PASSWORD_LENGTH ? value : null;
}

/** Defaults to "admin" so a deployment that only sets a password still works. */
export function adminUsername(): string {
  return process.env.ADMIN_USERNAME?.trim() || 'admin';
}

export function adminConfigured(): boolean {
  return adminPassword() !== null;
}

export { MIN_PASSWORD_LENGTH as MIN_ADMIN_PASSWORD_LENGTH };

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  // timingSafeEqual throws on a length mismatch, so lengths are checked first.
  // The length of the secret is not itself sensitive.
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Checks a submitted username and password.
 *
 * Both comparisons always run — no `&&` short circuit — so a correct username
 * with a wrong password takes exactly as long as a wrong username, and an
 * attacker cannot confirm the username separately.
 */
export function checkCredentials(username: string, password: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;

  const userOk = safeEqual(username.trim().toLowerCase(), adminUsername().toLowerCase());
  const passOk = safeEqual(password, expected);
  return userOk && passOk;
}

/*
 * The session cookie is `payload.signature`, signed with the admin password as
 * the HMAC key. The password itself is never in the cookie and cannot be
 * derived from the signature.
 */

interface AdminSession {
  /** Expiry, seconds since epoch. Inside the signed payload, so unforgeable. */
  exp: number;
}

function sign(body: string, key: string): string {
  return createHmac('sha256', key).update(body).digest('base64url');
}

export function createAdminSession(): string | null {
  const key = adminPassword();
  if (!key) return null;

  const payload: AdminSession = {
    exp: Math.floor(Date.now() / 1000) + SESSION_HOURS * 60 * 60,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body, key)}`;
}

export function isValidSession(cookie: string | undefined | null): boolean {
  const key = adminPassword();
  if (!key || !cookie) return false;

  const [body, signature] = cookie.split('.');
  if (!body || !signature) return false;
  if (!safeEqual(signature, sign(body, key))) return false;

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
