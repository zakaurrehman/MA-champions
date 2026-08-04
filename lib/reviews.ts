/**
 * Review access. Same boundary rules as `lib/products.ts`.
 *
 * There are currently no reviews. Sections that display them return null rather
 * than rendering an empty shell or placeholder testimonials — see the warning
 * in data/reviews.json before adding anything here.
 */

import raw from '@/data/reviews.json';

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
}

async function loadReviews(): Promise<Review[]> {
  return raw.reviews as unknown as Review[];
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
