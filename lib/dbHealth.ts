import 'server-only';
import { cache } from 'react';
import { db } from './db';

/**
 * Is the database actually reachable?
 *
 * Several admin pages used to treat "the query threw" as "there is no data" —
 * the products page reported "connected but empty", the orders page reported no
 * orders. When the provider blocked access those were both wrong in the worst
 * way: they told the owner their catalogue and their orders were gone when
 * nothing had been lost at all.
 *
 * `down` is kept separate from "empty" so a page can say which one it is.
 */

export type DbHealth =
  | { status: 'ok' }
  | { status: 'unconfigured' }
  | { status: 'down'; reason: 'quota' | 'unreachable' };

/**
 * One tiny `SELECT 1`, cached per request so a page and the admin chrome around
 * it share a single round trip. When the provider has blocked the project the
 * answer is a few bytes of HTTP 402, so checking costs nothing.
 */
export const dbHealth = cache(async (): Promise<DbHealth> => {
  const sql = db();
  if (!sql) return { status: 'unconfigured' };

  try {
    await sql`SELECT 1`;
    return { status: 'ok' };
  } catch (error) {
    // Neon reports an exhausted allowance as HTTP 402 with "data transfer
    // quota" in the body, which surfaces in the error message.
    const message = String((error as { message?: unknown })?.message ?? '');
    const quota = /quota|\b402\b|payment required/i.test(message);
    return { status: 'down', reason: quota ? 'quota' : 'unreachable' };
  }
});
