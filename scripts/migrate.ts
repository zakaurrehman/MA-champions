/**
 * Creates the reviews table. Safe to run repeatedly.
 *
 *   npm run migrate
 *
 * OPTIONAL. The API route creates the table by itself on the first review, so
 * this exists only for anyone who prefers to set it up ahead of time or to
 * confirm the connection works.
 *
 * Requires DATABASE_URL in .env.local. Nothing here drops or rewrites data.
 */

import { neon } from '@neondatabase/serverless';
import { ensureReviewsTable, reviewsTableExists } from '../lib/reviewsSchema.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  console.error('Put it in .env.local, then run:  npm run migrate');
  process.exit(1);
}

const sql = neon(url);

console.log('Connecting…');
const before = await reviewsTableExists(sql);
console.log(`  reviews table exists: ${before}`);

if (!before) console.log('Creating reviews table…');
await ensureReviewsTable(sql);

const rows = (await sql`
  SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
    COUNT(*) FILTER (WHERE status = 'approved')::int AS approved
  FROM reviews
`) as unknown as { total: number; pending: number; approved: number }[];

const { total, pending, approved } = rows[0] ?? { total: 0, pending: 0, approved: 0 };

console.log('');
console.log('Done.');
console.log(`  ${total} review(s) — ${pending} pending, ${approved} approved`);
console.log('');
console.log('To approve a review:');
console.log("  UPDATE reviews SET status = 'approved', updated_at = NOW() WHERE id = <id>;");
