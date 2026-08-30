import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Proof that someone is entitled to see a specific order.
 *
 * An order reference (MA-7QK2F) is a WEAK secret. It gets read aloud over
 * WhatsApp and pasted into chats, so it can never be the only thing standing
 * between a stranger and a customer's name, address and total. That is exactly
 * the insecure-direct-object-reference shape: guess the identifier, get the
 * record.
 *
 * So the full order view needs one of two things:
 *
 *  1. This token, which we mint server-side the moment a payment completes and
 *     put in the confirmation URL. It is an HMAC over the reference, so it
 *     cannot be forged or moved to a different order.
 *  2. The email or phone the customer actually gave at checkout — see
 *     contactMatches() in lib/contact.ts.
 *
 * The reference alone still gets the existing minimal status view: a stage
 * name and a belt name, nothing that hurts if guessed.
 */

const MAX_AGE_DAYS = 60;

function secret(): string | null {
  const value = process.env.AUTH_SECRET;
  // A short secret is no secret. Treat it as unset rather than pretend.
  return value && value.length >= 32 ? value : null;
}

export function orderTokensAvailable(): boolean {
  return secret() !== null;
}

function sign(data: string, key: string): string {
  return createHmac('sha256', key).update(data).digest('base64url');
}

/**
 * Mints an access token for one reference. Returns null when AUTH_SECRET is
 * unset — the caller must then fall back to contact verification rather than
 * issue something unsigned.
 */
export function createOrderAccessToken(reference: string): string | null {
  const key = secret();
  if (!key) return null;

  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_DAYS * 24 * 60 * 60;
  // The reference is inside the signed payload, so a token issued for one
  // order cannot be replayed against another.
  const body = `${reference}.${expires}`;
  return `${expires}.${sign(body, key)}`;
}

export function verifyOrderAccessToken(reference: string, token: string | null): boolean {
  const key = secret();
  if (!key || !token) return false;

  const [expiresRaw, signature] = token.split('.');
  if (!expiresRaw || !signature) return false;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;

  const expected = sign(`${reference}.${expires}`, key);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
