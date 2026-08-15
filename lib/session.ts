import 'server-only';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Customer sessions.
 *
 * A signed, stateless cookie rather than a session table: the payload is tiny,
 * it needs no database round trip on every request, and there is nothing in it
 * worth stealing beyond the identity itself.
 *
 * Signed with HMAC-SHA256 and compared in constant time. The signature is what
 * makes it safe — without it, a customer could edit the cookie and become
 * anyone. Never read this payload without verifying first.
 */

export const SESSION_COOKIE = 'ma-session';
export const OAUTH_STATE_COOKIE = 'ma-oauth-state';

const MAX_AGE_DAYS = 30;

export interface SessionUser {
  /** Google's stable subject id. The identity we key on. */
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

interface SessionPayload extends SessionUser {
  /** Expiry, seconds since epoch. */
  exp: number;
}

function secret(): string | null {
  const value = process.env.AUTH_SECRET;
  // A short secret is no secret. Treat it as unset rather than pretend.
  return value && value.length >= 32 ? value : null;
}

/**
 * Sessions work with nothing but AUTH_SECRET — that is all email and password
 * sign-in needs. Google is a separate, optional capability on top, so the two
 * checks are separate: a missing Google client must not disable the whole
 * account system.
 */
export function sessionConfigured(): boolean {
  return Boolean(secret());
}

export function googleConfigured(): boolean {
  return Boolean(
    secret() && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

const b64url = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64url');

function sign(data: string, key: string): string {
  return createHmac('sha256', key).update(data).digest('base64url');
}

export function createSessionToken(user: SessionUser): string | null {
  const key = secret();
  if (!key) return null;

  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_DAYS * 24 * 60 * 60,
  };

  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body, key)}`;
}

export function verifySessionToken(token: string | undefined): SessionUser | null {
  const key = secret();
  if (!key || !token) return null;

  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body, key);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    // Expiry is inside the signed payload, so it cannot be extended by hand.
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub || !payload.email) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch {
    return null;
  }
}

/** The signed-in customer, or null. Safe to call anywhere on the server. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // 'lax', not 'strict': the OAuth callback is a cross-site redirect back from
  // Google, and 'strict' would withhold the cookie and break sign-in.
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
};

export const randomToken = (): string => randomBytes(24).toString('base64url');
