import 'server-only';

/**
 * Structural type for the pieces of Neon's tag we actually use.
 *
 * Neon's own NeonQueryFunction is generic over array-mode and full-results, and
 * `ReturnType<typeof neon>` instantiates those to their constraints rather than
 * their defaults — so the concrete tag is not assignable to it. These helpers
 * only ever call the tag as a template literal, so describing exactly that
 * keeps both the app and the migration script assignable.
 */
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;

/**
 * Schema creation, shared by the migration script and the on-demand healing in
 * the API routes. Every statement is IF NOT EXISTS, so running it repeatedly is
 * safe and it never destroys data.
 *
 * On the JSONB columns: specs, variants and images are stored as documents
 * rather than in separate tables. For a catalogue of this size that is a
 * deliberate trade — it keeps the row shape identical to the `Product` type the
 * whole app already uses, so there are no joins to assemble and no mapping
 * layer to drift. If the catalogue ever reaches thousands of products with
 * per-variant stock queries, variants earn their own table; today they would
 * only add work.
 */

export async function ensureReviewsTable(sql: SqlTag) {
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id            BIGSERIAL PRIMARY KEY,
      product_slug  TEXT        NOT NULL,
      author_name   TEXT        NOT NULL,
      rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
      title         TEXT,
      body          TEXT        NOT NULL,
      status        TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
      verified      BOOLEAN     NOT NULL DEFAULT FALSE,
      submitter_key TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS reviews_slug_status_idx
    ON reviews (product_slug, status, created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS reviews_submitter_idx
    ON reviews (submitter_key, created_at DESC)
  `;
}

export async function ensureProductsTable(sql: SqlTag) {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id                BIGSERIAL PRIMARY KEY,
      slug              TEXT        NOT NULL UNIQUE,
      name              TEXT        NOT NULL,
      category          TEXT        NOT NULL DEFAULT 'wrestling',
      collections       TEXT[]      NOT NULL DEFAULT '{}',
      material_tier     TEXT        NOT NULL DEFAULT 'hd-cnc-premium',

      -- Money as NUMERIC, never floating point. 0.1 + 0.2 must not be 0.30000000000000004
      -- on an invoice.
      price             NUMERIC(10,2) NOT NULL,
      original_price    NUMERIC(10,2),
      sale_price        NUMERIC(10,2),
      currency          TEXT        NOT NULL DEFAULT 'USD',

      in_stock          BOOLEAN     NOT NULL DEFAULT TRUE,
      featured          BOOLEAN     NOT NULL DEFAULT FALSE,
      shop_visible      BOOLEAN     NOT NULL DEFAULT TRUE,
      custom_gallery    BOOLEAN     NOT NULL DEFAULT FALSE,

      short_description TEXT        NOT NULL DEFAULT '',
      description       TEXT        NOT NULL DEFAULT '',

      variant_label     TEXT,
      specs             JSONB       NOT NULL DEFAULT '{}'::jsonb,
      variants          JSONB       NOT NULL DEFAULT '[]'::jsonb,
      images            JSONB       NOT NULL DEFAULT '[]'::jsonb,

      sort_order        INTEGER     NOT NULL DEFAULT 0,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // The shop grid filters on visibility then orders — one index covers both.
  await sql`
    CREATE INDEX IF NOT EXISTS products_visible_idx
    ON products (shop_visible, sort_order, created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS products_tier_idx ON products (material_tier)
  `;
  // GIN so `collections @> ARRAY['wrestling']` does not scan the table.
  await sql`
    CREATE INDEX IF NOT EXISTS products_collections_idx ON products USING GIN (collections)
  `;
}

export async function ensureOrdersTable(sql: SqlTag) {
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id             BIGSERIAL PRIMARY KEY,
      -- Short human reference for quoting over WhatsApp: "MA-7QK2F".
      reference      TEXT        NOT NULL UNIQUE,

      -- Where it came from: a cart checkout, a single product, or the builder.
      kind           TEXT        NOT NULL DEFAULT 'cart'
                     CHECK (kind IN ('cart', 'product', 'build')),
      -- How the customer was handed off. WhatsApp cannot confirm delivery, so
      -- this records intent, never payment.
      channel        TEXT        NOT NULL DEFAULT 'whatsapp',

      status         TEXT        NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','quoted','paid','production','shipped','completed','cancelled')),

      customer_name  TEXT,
      customer_email TEXT,
      customer_note  TEXT,

      items          JSONB       NOT NULL DEFAULT '[]'::jsonb,
      build_spec     JSONB,

      -- Recomputed on the server from the catalogue, never trusted from the
      -- browser. See authoritativeLineTotal() in lib/pricing.ts.
      subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency       TEXT        NOT NULL DEFAULT 'USD',

      submitter_key  TEXT,
      admin_note     TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // The admin list is "newest first, open ones first".
  await sql`
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status, created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS orders_submitter_idx ON orders (submitter_key, created_at DESC)
  `;
}

export async function ensureAllTables(sql: SqlTag) {
  await ensureReviewsTable(sql);
  await ensureProductsTable(sql);
  await ensureOrdersTable(sql);
}

