/**
 * Normalising the two things a guest can prove an order with.
 *
 * Customers do not type contact details consistently. The same person is
 * "+92 302 405 7417" at checkout and "03024057417" a week later when they come
 * back to find the order, and "Bob@Example.com " with a trailing space. If the
 * comparison is literal, the customer is locked out of their own order.
 *
 * No `server-only` import: the browser uses these for pre-submit validation
 * so people are told about a malformed entry before a round trip.
 */

/** Digits only, so formatting differences stop mattering. */
export function normalisePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Phone numbers are compared on their last 9 digits.
 *
 * A country code is the part people omit or add freely — the same Pakistani
 * mobile is 923024057417, 03024057417 and 3024057417 depending on where it was
 * typed. Nine digits is long enough that a collision between two real
 * customers is not a practical concern, and short enough to survive that.
 */
const PHONE_MATCH_DIGITS = 9;

export function phoneTail(value: string): string {
  const digits = normalisePhone(value);
  return digits.length > PHONE_MATCH_DIGITS ? digits.slice(-PHONE_MATCH_DIGITS) : digits;
}

export type ContactKind = 'email' | 'phone' | 'unknown';

export function contactKind(value: string): ContactKind {
  const trimmed = value.trim();
  if (!trimmed) return 'unknown';
  if (trimmed.includes('@')) return 'email';
  // Enough digits to be a phone number rather than a typo'd reference.
  if (normalisePhone(trimmed).length >= 7) return 'phone';
  return 'unknown';
}

/**
 * Does the contact detail a guest supplied match what is stored on the order?
 *
 * Compares only against the matching kind: an email is never checked against a
 * phone column. Empty stored values never match, so an order with no email
 * cannot be unlocked by submitting an empty one.
 */
export function contactMatches(
  supplied: string,
  stored: { email: string | null; phone: string | null }
): boolean {
  const kind = contactKind(supplied);

  if (kind === 'email') {
    if (!stored.email) return false;
    return normaliseEmail(supplied) === normaliseEmail(stored.email);
  }

  if (kind === 'phone') {
    if (!stored.phone) return false;
    const a = phoneTail(supplied);
    const b = phoneTail(stored.phone);
    return a.length >= 7 && a === b;
  }

  return false;
}
