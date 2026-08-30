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

/*
 * The reviews table was once defined in both this file and lib/reviewsSchema.ts.
 * Two copies of one CREATE TABLE is a bug waiting to happen — add a column to
 * one and not the other and the schema depends on which code path created the
 * table first. It now lives here only.
 *
 * Re-exporting it from a second module was the obvious fix and the wrong one:
 * scripts/migrate.ts is run by bare Node, whose type-stripping needs explicit
 * .ts extensions on relative imports, so the extensionless re-export broke
 * `npm run migrate` outright. One file, no indirection, nothing to resolve.
 */
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
      -- Customer photo URLs (Vercel Blob). URLs only — never image bytes, which
      -- would bloat every row this table is read from.
      photos        JSONB       NOT NULL DEFAULT '[]'::jsonb,
      -- Hashed, never the raw address. Used only for rate limiting.
      submitter_key TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Added after the table shipped, so existing databases need it too.
  await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]'::jsonb`;

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
   * The custom order form: a phone number to reach them on, and the artwork
   * they uploaded. design_url points at Vercel Blob — the file itself is never
   * put in the database.
   */
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_url TEXT`;

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

/**
 * Failed sign-in attempts, for rate limiting. Shared by customer sign-in and
 * the admin panel — the `key` is already a hash, so one table serves both
 * without either being able to read the other's identifiers.
 */
export async function ensureAuthAttemptsTable(sql: SqlTag) {
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

  await ensureAuthAttemptsTable(sql);

  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT`;

  /*
   * Guest orders are matched to an account by email OR phone, so both need an
   * index that survives the normalisation the query applies. Phone numbers are
   * typed inconsistently — +92 302 405 7417, 0302-4057417 — so comparison is
   * done on digits only.
   */
  await sql`
    CREATE INDEX IF NOT EXISTS orders_phone_digits_idx
    ON orders (regexp_replace(COALESCE(customer_phone, ''), '\\D', '', 'g'))
  `;

  /*
   * Orders are matched to a customer by email, because most arrive through
   * WhatsApp or crypto with no session attached. Indexed case-insensitively:
   * people type their address inconsistently and would otherwise not see
   * their own order history.
   */
  await sql`CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (LOWER(customer_email))`;
}

/**
 * The admin password, once it has been changed from the panel.
 *
 * A single row, enforced by the CHECK: there is one operator, and a table that
 * can hold two admin passwords is a table that will eventually hold a forgotten
 * one. Only the scrypt hash is stored — the panel can change the password but
 * can never display it.
 */
export async function ensureAdminAuthTable(sql: SqlTag) {
  await sql`
    CREATE TABLE IF NOT EXISTS admin_auth (
      id            INT         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      username      TEXT        NOT NULL,
      password_hash TEXT        NOT NULL,
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

/**
 * One-time password reset links.
 *
 * The token is stored as a SHA-256 hash, never in the clear, so a leaked
 * backup cannot be replayed into account takeovers. `delivered` records whether
 * we managed to email the link — when no email service is configured it stays
 * false and the admin panel can issue a fresh link to send by hand.
 */
export async function ensurePasswordResetsTable(sql: SqlTag) {
  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      id         BIGSERIAL   PRIMARY KEY,
      email      TEXT        NOT NULL,
      token_hash TEXT        NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ,
      delivered  BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS password_resets_token_idx ON password_resets (token_hash)`;
  await sql`
    CREATE INDEX IF NOT EXISTS password_resets_pending_idx
    ON password_resets (used_at, created_at DESC)
  `;
}

export async function ensureAllTables(sql: SqlTag) {
  await ensureReviewsTable(sql);
  await ensureProductsTable(sql);
  await ensureOrdersTable(sql);
  await ensureCustomersTable(sql);
  await ensureAdminAuthTable(sql);
  await ensurePasswordResetsTable(sql);
}

