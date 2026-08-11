import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db, hasDatabase } from '@/lib/db';
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

export async function POST(request: Request) {
  const sql = db();
  if (!sql) {
    return NextResponse.json(
      { error: 'Reviews are not available yet. Please try again later.' },
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

  // Neon's tagged template returns a union type, so results are cast rather
  // than destructured directly.
  const recentRows = (await sql`
    SELECT COUNT(*)::int AS recent
    FROM reviews
    WHERE submitter_key = ${key}
      AND created_at > NOW() - (${RATE_WINDOW_HOURS} || ' hours')::interval
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
}

export async function GET(request: Request) {
  if (!hasDatabase()) return NextResponse.json({ reviews: [] });

  const sql = db()!;
  const slug = new URL(request.url).searchParams.get('product');
  if (!slug) return NextResponse.json({ error: 'Missing product.' }, { status: 400 });

  const rows = await sql`
    SELECT id, author_name, rating, title, body, verified, created_at
    FROM reviews
    WHERE product_slug = ${slug} AND status = 'approved'
    ORDER BY created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ reviews: rows });
}
