/**
 * Review access. Same boundary rules as `lib/products.ts`.
 *
 * There are currently no reviews. Sections that display them return null rather
 * than rendering an empty shell or placeholder testimonials — see the warning
 * in data/reviews.json before adding anything here.
 */

import raw from '@/data/reviews.json';
import { db } from './db';

export interface Review {
  id: string;
  name: string;
  location?: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  productSlug?: string;
  verified: boolean;
  photo?: string;
  /**
   * Customer-uploaded photos. Only ever populated from approved rows — the
   * query below filters on status, so an unapproved review's photos are not
   * merely hidden by the UI, they never leave the database.
   */
  photos: string[];
}

interface ReviewRow {
  id: number | string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  photos: unknown;
  product_slug: string;
  created_at: string | Date;
}

/**
 * Reviews come from Postgres when DATABASE_URL is set, and fall back to the
 * JSON seed otherwise so local and preview builds still work. Only APPROVED
 * rows are ever read — pending submissions are invisible until moderated.
 */
const withPhotos = (list: unknown): Review[] =>
  (list as Review[]).map((r) => ({ ...r, photos: Array.isArray(r.photos) ? r.photos : [] }));

async function loadReviews(): Promise<Review[]> {
  const sql = db();
  if (!sql) return withPhotos(raw.reviews);

  try {
    const rows = (await sql`
      SELECT id, product_slug, author_name, rating, title, body, verified, photos, created_at
      FROM reviews
      WHERE status = 'approved'
      ORDER BY created_at DESC
      LIMIT 500
    `) as unknown as ReviewRow[];

    return rows.map((r) => ({
      id: String(r.id),
      name: r.author_name,
      rating: r.rating,
      date: new Date(r.created_at).toISOString().slice(0, 10),
      title: r.title ?? '',
      body: r.body,
      productSlug: r.product_slug,
      verified: r.verified,
      // JSONB comes back parsed, but a legacy row predating the column is null.
      photos: Array.isArray(r.photos) ? (r.photos as string[]) : [],
    }));
  } catch (error) {
    /*
     * A database created before review photos existed has no photos column, so
     * the select above fails with 42703. Retry without it rather than dropping
     * every real review back to the JSON seed — the reviews matter more than
     * the photos, and the write path repairs the column on the next submission.
     */
    if ((error as { code?: string })?.code === '42703') {
      try {
        const rows = (await sql`
          SELECT id, product_slug, author_name, rating, title, body, verified, created_at
          FROM reviews
          WHERE status = 'approved'
          ORDER BY created_at DESC
          LIMIT 500
        `) as unknown as ReviewRow[];

        return rows.map((r) => ({
          id: String(r.id),
          name: r.author_name,
          rating: r.rating,
          date: new Date(r.created_at).toISOString().slice(0, 10),
          title: r.title ?? '',
          body: r.body,
          productSlug: r.product_slug,
          verified: r.verified,
          photos: [],
        }));
      } catch {
        /* fall through to the seed */
      }
    }

    // A database blip must not take the product page down with it.
    console.error('[reviews] database read failed, falling back to seed:', error);
    return withPhotos(raw.reviews);
  }
}

export async function getReviews(limit?: number): Promise<Review[]> {
  const all = await loadReviews();
  const sorted = all.slice().sort((a, b) => b.date.localeCompare(a.date));
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getReviewsForProduct(slug: string): Promise<Review[]> {
  const all = await loadReviews();
  return all.filter((r) => r.productSlug === slug);
}

/** Aggregate rating for JSON-LD. Returns null when there is nothing to average. */
export async function getAggregateRating(): Promise<{ value: number; count: number } | null> {
  const all = await loadReviews();
  if (all.length === 0) return null;
  const value = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  return { value: Math.round(value * 10) / 10, count: all.length };
}
