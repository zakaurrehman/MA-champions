import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Admin access via a single shared secret.
 *
 * There is no user system on this site and no reason to build one to moderate
 * reviews. A shared token in the hosting environment is proportionate — but it
 * is only as good as these rules, so they are not negotiable:
 *
 *  - No ADMIN_TOKEN set means the panel is DISABLED, never open. An unset
 *    secret must not compare equal to an empty submission.
 *  - A short token is treated as unset. A four-character secret on a public
 *    URL is brute-forced in seconds.
 *  - The token is compared in constant time, so response timing cannot be used
 *    to recover it character by character.
 *  - It travels in an httpOnly cookie, never in a URL. Query strings leak into
 *    browser history, server logs and Referer headers.
 */

export const ADMIN_COOKIE = 'ma-admin';
const MIN_TOKEN_LENGTH = 16;

export function adminConfigured(): boolean {
  const token = process.env.ADMIN_TOKEN;
  return typeof token === 'string' && token.length >= MIN_TOKEN_LENGTH;
}

/** Constant-time comparison. False whenever the panel is not configured. */
export function isValidToken(provided: string | undefined | null): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < MIN_TOKEN_LENGTH) return false;
  if (!provided) return false;

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');

  // timingSafeEqual throws on length mismatch, so compare lengths first. The
  // length of the secret is not itself sensitive.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** True when the current request carries a valid admin cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(ADMIN_COOKIE)?.value);
}
