import 'server-only';
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

/**
 * Password hashing with scrypt.
 *
 * scrypt is in Node's standard library and is memory-hard, which is what makes
 * it expensive to attack with GPUs. No dependency needed, and nothing here is
 * hand-rolled cryptography — it is the platform primitive used as intended.
 *
 * Never store, log or email a password. Only the hash below ever leaves this
 * module, and it cannot be reversed.
 */

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

export const MIN_PASSWORD_LENGTH = 8;

/** Returns `salt:hash`, both hex. Salt is per-password, never shared. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

/**
 * Constant-time verification. Returns false rather than throwing on a
 * malformed stored value, so a corrupt row cannot 500 the login endpoint.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;

    const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    const expected = Buffer.from(hash, 'hex');

    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Basic strength rules. Deliberately not a maze of character classes. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 200) return 'That password is too long.';
  // Blocks the handful of passwords that appear in every breach list.
  const weak = ['password', '12345678', 'qwerty123', 'championship', 'belt1234'];
  if (weak.includes(password.toLowerCase())) return 'Please choose something less common.';
  return null;
}
