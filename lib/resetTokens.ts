import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './db';
import { ensurePasswordResetsTable } from './db-schema';
import { site } from './site';

/**
 * One-time password reset links.
 *
 * The token is random and stored only as a SHA-256 hash. A plain hash is
 * correct here where it would be wrong for a password: the token already has
 * 192 bits of entropy, so there is nothing to brute force and nothing to salt
 * against. What it buys is that a leaked database backup cannot be replayed
 * into account takeovers.
 *
 * Links expire in an hour and are burned on use.
 */

const TTL_MINUTES = 60;

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export interface IssuedReset {
  token: string;
  url: string;
}

/**
 * Creates a reset link for an address. Any earlier unused link for the same
 * address is burned first, so only the most recent one works.
 *
 * Does NOT check whether the account exists — that is the caller's job, and the
 * caller must not change its response based on the answer.
 */
export async function issueReset(email: string): Promise<IssuedReset | null> {
  const sql = db();
  if (!sql) return null;

  await ensurePasswordResetsTable(sql);

  const token = randomBytes(24).toString('base64url');

  await sql`
    UPDATE password_resets SET used_at = NOW()
    WHERE LOWER(email) = LOWER(${email}) AND used_at IS NULL
  `;
  await sql`
    INSERT INTO password_resets (email, token_hash, expires_at)
    VALUES (
      ${email.toLowerCase()},
      ${hashToken(token)},
      NOW() + make_interval(mins => ${TTL_MINUTES})
    )
  `;

  return { token, url: `${site.url}/reset-password?token=${token}` };
}

/** Marks the link delivered, so the admin panel stops listing it as waiting. */
export async function markDelivered(email: string): Promise<void> {
  const sql = db();
  if (!sql) return;
  try {
    await sql`
      UPDATE password_resets SET delivered = TRUE
      WHERE LOWER(email) = LOWER(${email}) AND used_at IS NULL
    `;
  } catch {
    /* best effort — delivery bookkeeping must never fail the request */
  }
}

/**
 * Consumes a token. Returns the email it belongs to, or null if it is unknown,
 * expired or already used. Burns the row in the same statement it validates it,
 * so two simultaneous requests cannot both succeed.
 */
export async function consumeReset(token: string): Promise<string | null> {
  const sql = db();
  if (!sql || !token) return null;

  await ensurePasswordResetsTable(sql);

  const rows = (await sql`
    UPDATE password_resets SET used_at = NOW()
    WHERE token_hash = ${hashToken(token)}
      AND used_at IS NULL
      AND expires_at > NOW()
    RETURNING email
  `) as unknown as { email: string }[];

  return rows[0]?.email ?? null;
}
