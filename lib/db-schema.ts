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

      -- Filled in by the admin once the belt ships.
      tracking_carrier TEXT,
      tracking_number  TEXT,

      submitter_key  TEXT,
      admin_note     TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  /*
   * Added after the table shipped, so they must be applied to existing
   * databases too. IF NOT EXISTS makes this safe to run every time.
   */
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_carrier TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT`;

  /*
   * Crypto payments are settled off-site and verified by hand: the customer
   * pays, submits the transaction reference and a screenshot, and an admin
   * confirms it on-chain. payment_verified stays false until a human has
   * actually checked — a screenshot proves nothing on its own and is trivial
   * to fake.
   */
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_network TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN NOT NULL DEFAULT FALSE`;

  // Customer lookups hit this on every /track-order submission.
  await sql`CREATE INDEX IF NOT EXISTS orders_reference_idx ON orders (reference)`;

  // The admin list is "newest first, open ones first".
  await sql`
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status, created_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS orders_submitter_idx ON orders (submitter_key, created_at DESC)
  `;
}

export async function ensureCustomersTable(sql: SqlTag) {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id         BIGSERIAL PRIMARY KEY,
      -- Google's subject id. Stable even if the customer changes their email,
      -- which is why identity keys on this and not on the address.
      google_sub TEXT        NOT NULL UNIQUE,
      email      TEXT        NOT NULL,
      name       TEXT,
      picture    TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  /*
   * Customers can now arrive two ways: Google, or email and password. So
   * google_sub must be nullable — Postgres allows many NULLs under a UNIQUE
   * constraint, so the uniqueness of real Google ids is unaffected.
   */
  await sql`ALTER TABLE customers ALTER COLUMN google_sub DROP NOT NULL`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT`;

  /*
   * Email is the identity for password accounts, so it must be unique — and
   * case-insensitively, or Bob@x.com and bob@x.com become two accounts and
   * whichever one you signed up with is a coin toss.
   */
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS customers_email_idx ON customers (LOWER(email))
  `;

  // Rate limiting for sign-in attempts.
  await sql`
    CREATE TABLE IF NOT EXISTS auth_attempts (
      id         BIGSERIAL PRIMARY KEY,
      key        TEXT        NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS auth_attempts_idx ON auth_attempts (key, created_at DESC)
  `;

  /*
   * Orders are matched to a customer by email, because most arrive through
   * WhatsApp or crypto with no session attached. Indexed case-insensitively:
   * people type their address inconsistently and would otherwise not see
   * their own order history.
   */
  await sql`CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (LOWER(customer_email))`;
}

export async function ensureAllTables(sql: SqlTag) {
  await ensureReviewsTable(sql);
  await ensureProductsTable(sql);
  await ensureOrdersTable(sql);
  await ensureCustomersTable(sql);
}

