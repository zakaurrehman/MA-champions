/**
 * Creates the reviews table. Safe to run repeatedly.
 *
 *   node --env-file=.env.local scripts/migrate.mjs
 *
 * Requires DATABASE_URL. Nothing here drops or rewrites existing data.
 */

import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  console.error('Put it in .env.local, then run:');
  console.error('  node --env-file=.env.local scripts/migrate.mjs');
  process.exit(1);
}

const sql = neon(url);

console.log('Creating reviews table…');

await sql`
  CREATE TABLE IF NOT EXISTS reviews (
    id            BIGSERIAL PRIMARY KEY,
    product_slug  TEXT        NOT NULL,
    author_name   TEXT        NOT NULL,
    rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title         TEXT,
    body          TEXT        NOT NULL,
    -- Reviews are held for moderation. A public form with no login will be
    -- spammed; nothing reaches the site until it is approved.
    status        TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
    verified      BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Hashed, never the raw address. Used only for rate limiting.
    submitter_key TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

// Product pages only ever read approved reviews for one slug.
await sql`
  CREATE INDEX IF NOT EXISTS reviews_slug_status_idx
  ON reviews (product_slug, status, created_at DESC)
`;

// Supports the duplicate/flood check on submit.
await sql`
  CREATE INDEX IF NOT EXISTS reviews_submitter_idx
  ON reviews (submitter_key, created_at DESC)
`;

const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM reviews`;

console.log('Done.');
console.log(`reviews table ready — ${count} row(s).`);
console.log('');
console.log('To approve a review:');
console.log("  UPDATE reviews SET status = 'approved' WHERE id = <id>;");
