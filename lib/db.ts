import 'server-only';
import { neon } from '@neondatabase/serverless';

/**
 * Neon Postgres connection.
 *
 * The database is OPTIONAL by design. Without DATABASE_URL the site still
 * builds and every page still renders — review reads fall back to the JSON
 * seed and writes are refused with a clear error. That keeps local development
 * and preview builds working without anyone needing production credentials.
 */

let cached: ReturnType<typeof neon> | null = null;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/** The SQL tag, or null when no database is configured. */
export function db() {
  if (!process.env.DATABASE_URL) return null;
  if (!cached) cached = neon(process.env.DATABASE_URL);
  return cached;
}
