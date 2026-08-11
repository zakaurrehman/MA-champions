/**
 * The reviews table definition — the single source of truth.
 *
 * Imported by BOTH the API route (which self-heals if the table is missing)
 * and scripts/migrate.ts. Deliberately free of any `server-only` import so a
 * plain Node script can use it too.
 *
 * Every statement is idempotent. Running this repeatedly changes nothing.
 */

/** Minimal shape of the Neon tagged-template function we need. */
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;

export async function ensureReviewsTable(sql: SqlTag): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id            BIGSERIAL PRIMARY KEY,
      product_slug  TEXT        NOT NULL,
      author_name   TEXT        NOT NULL,
      rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
      title         TEXT,
      body          TEXT        NOT NULL,
      -- Held for moderation. A public form with no login will be spammed;
      -- nothing reaches the site until it is approved.
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

  // Supports the duplicate and flood checks on submit.
  await sql`
    CREATE INDEX IF NOT EXISTS reviews_submitter_idx
    ON reviews (submitter_key, created_at DESC)
  `;
}

/** True when the reviews table exists. Used by the diagnostic endpoint. */
export async function reviewsTableExists(sql: SqlTag): Promise<boolean> {
  const rows = (await sql`
    SELECT to_regclass('public.reviews') IS NOT NULL AS present
  `) as unknown as { present: boolean }[];
  return rows[0]?.present === true;
}
