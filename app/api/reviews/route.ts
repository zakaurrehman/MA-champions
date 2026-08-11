import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db, hasDatabase } from '@/lib/db';
import { ensureReviewsTable, reviewsTableExists } from '@/lib/reviewsSchema';
import { getShopProducts } from '@/lib/products';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX = { name: 80, title: 120, body: 1200 };
const MIN_BODY = 10;
/** One review per person per product, and no flooding across products. */
const RATE_WINDOW_HOURS = 24;
const RATE_MAX_PER_WINDOW = 3;

/**
 * Hash of IP + user agent. We never store the raw address — it is personal
 * data we have no reason to keep, and a hash is enough for rate limiting.
 */
function submitterKey(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const ua = request.headers.get('user-agent') ?? '';
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32);
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/** Postgres "relation does not exist". */
const UNDEFINED_TABLE = '42P01';

const isUndefinedTable = (error: unknown): boolean =>
  (error as { code?: string })?.code === UNDEFINED_TABLE;

export async function POST(request: Request) {
  const sql = db();
  if (!sql) {
    // DATABASE_URL is not set in this environment. Distinct from a missing
    // table, and only fixable in the hosting dashboard.
    return NextResponse.json(
      {
        error: 'Reviews are not available yet. Please send it to us on WhatsApp instead.',
        reason: 'no-database-url',
      },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const input = payload as Record<string, unknown>;

  const productSlug = clean(input.productSlug, 120);
  const authorName = clean(input.name, MAX.name);
  const title = clean(input.title, MAX.title);
  const body = clean(input.body, MAX.body);
  const rating = Number(input.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Please choose a rating from 1 to 5.' }, { status: 400 });
  }
  if (authorName.length < 2) {
    return NextResponse.json({ error: 'Please add your name.' }, { status: 400 });
  }
  if (body.length < MIN_BODY) {
    return NextResponse.json({ error: 'Please write a little more.' }, { status: 400 });
  }

  /*
   * The slug must match a real, shop-visible product. Without this check the
   * endpoint would happily store reviews against arbitrary strings, which is
   * both a junk-data problem and a way to probe the catalogue.
   */
  const products = await getShopProducts();
  if (!products.some((p) => p.slug === productSlug)) {
    return NextResponse.json({ error: 'Unknown product.' }, { status: 400 });
  }

  const key = submitterKey(request);

  try {
    /*
     * make_interval() rather than string concatenation. Neon sends the window
     * as a bind parameter, and Postgres cannot infer the type of $1 inside
     * `$1 || ' hours'` — it raises "could not determine data type of parameter
     * $1" and every submission fails with a 500 before touching any data.
     * make_interval's signature types the parameter for us.
     *
     * Neon's tagged template returns a union type, so rows are cast rather
     * than destructured directly.
     */
    const recentRows = (await sql`
      SELECT COUNT(*)::int AS recent
      FROM reviews
      WHERE submitter_key = ${key}
        AND created_at > NOW() - make_interval(hours => ${RATE_WINDOW_HOURS})
    `) as unknown as { recent: number }[];

    if ((recentRows[0]?.recent ?? 0) >= RATE_MAX_PER_WINDOW) {
      return NextResponse.json(
        { error: 'You have submitted several reviews recently. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    const dupRows = (await sql`
      SELECT COUNT(*)::int AS duplicate
      FROM reviews
      WHERE submitter_key = ${key} AND product_slug = ${productSlug}
    `) as unknown as { duplicate: number }[];

    if ((dupRows[0]?.duplicate ?? 0) > 0) {
      return NextResponse.json(
        { error: 'You have already reviewed this belt. Thank you!' },
        { status: 409 }
      );
    }

    await sql`
      INSERT INTO reviews (product_slug, author_name, rating, title, body, submitter_key)
      VALUES (${productSlug}, ${authorName}, ${rating}, ${title || null}, ${body}, ${key})
    `;


    // Deliberately does NOT return the review: it is not public until approved.
    return NextResponse.json(
      { ok: true, message: 'Thank you. Your review will appear once we have checked it.' },
      { status: 201 }
    );
  } catch (error) {
    /*
     * The table does not exist yet. Rather than making someone SSH in and run
     * a migration before a single review can be left, create it and retry
     * once. The DDL is idempotent, so a race between two submissions is safe.
     */
    if (isUndefinedTable(error)) {
      try {
        console.warn('[api/reviews] reviews table missing — creating it now');
        await ensureReviewsTable(sql);

        await sql`
          INSERT INTO reviews (product_slug, author_name, rating, title, body, submitter_key)
          VALUES (${productSlug}, ${authorName}, ${rating}, ${title || null}, ${body}, ${key})
        `;

        return NextResponse.json(
          { ok: true, message: 'Thank you. Your review will appear once we have checked it.' },
          { status: 201 }
        );
      } catch (retryError) {
        console.error('[api/reviews] table creation or retry failed:', retryError);
        return NextResponse.json(
          {
            error: 'We could not save your review just now. Please try again shortly.',
            reason: 'migration-failed',
          },
          { status: 500 }
        );
      }
    }

    // Log the real cause; never send database internals to the browser.
    console.error('[api/reviews] insert failed:', error);
    return NextResponse.json(
      { error: 'We could not save your review just now. Please try again shortly.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  /*
   * Health check: GET /api/reviews?diagnose=1
   *
   * Reports only booleans and a count — no connection string, no credentials,
   * no review content. Enough to tell "no DATABASE_URL" apart from "table not
   * created", which are the two causes of a 503 and are otherwise
   * indistinguishable from the browser.
   */
  if (params.get('diagnose')) {
    const sql = db();
    if (!sql) {
      return NextResponse.json({
        databaseUrl: false,
        tableExists: false,
        fix: 'Set DATABASE_URL in the hosting environment and redeploy.',
      });
    }

    try {
      const exists = await reviewsTableExists(sql);
      const counts = exists
        ? ((await sql`
            SELECT
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
              COUNT(*) FILTER (WHERE status = 'approved')::int AS approved
            FROM reviews
          `) as unknown as { total: number; pending: number; approved: number }[])[0]
        : null;

      return NextResponse.json({
        databaseUrl: true,
        tableExists: exists,
        counts,
        fix: exists ? null : 'The table is created automatically on the next submission.',
      });
    } catch (error) {
      console.error('[api/reviews] diagnose failed:', error);
      return NextResponse.json(
        { databaseUrl: true, tableExists: null, error: 'Could not reach the database.' },
        { status: 500 }
      );
    }
  }

  if (!hasDatabase()) return NextResponse.json({ reviews: [] });

  const sql = db()!;
  const slug = params.get('product');
  if (!slug) return NextResponse.json({ error: 'Missing product.' }, { status: 400 });

  try {
    const rows = await sql`
      SELECT id, author_name, rating, title, body, verified, created_at
      FROM reviews
      WHERE product_slug = ${slug} AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({ reviews: rows });
  } catch (error) {
    // An unmigrated or unreachable database must not break a product page —
    // it simply has no reviews to show.
    console.error('[api/reviews] read failed:', error);
    return NextResponse.json({ reviews: [] });
  }
}
