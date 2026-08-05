/**
 * Fuzzy product search.
 *
 * Pure functions over an array — no index, no dependency. At catalogue sizes
 * up to a few thousand this runs in well under a frame, and it keeps search
 * working offline and without a service.
 *
 * Matching is deliberately more forgiving than `includes()`: "wingd eagl"
 * and "24k" should both find the right belt, because people mistype and
 * abbreviate when searching for belts.
 */

import type { Product } from './types';

export interface SearchHit {
  product: Product;
  score: number;
}

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

/**
 * Subsequence match: every character of `query` appears in `text` in order.
 * Returns a score, higher is better, or 0 for no match. Consecutive runs and
 * matches at word starts score higher, so "big gold" beats a scattered match.
 */
function fuzzyScore(text: string, query: string): number {
  if (!query) return 0;
  if (text.includes(query)) {
    // Exact substring is always the strongest signal.
    return 1000 - text.indexOf(query);
  }

  let ti = 0;
  let score = 0;
  let run = 0;

  for (const char of query) {
    if (char === ' ') continue;

    const found = text.indexOf(char, ti);
    if (found === -1) return 0;

    // Word-start matches are worth more than mid-word ones.
    const atWordStart = found === 0 || text[found - 1] === ' ';
    run = found === ti ? run + 1 : 0;
    score += 1 + run * 2 + (atWordStart ? 3 : 0);
    ti = found + 1;
  }

  return score;
}

/** Fields are weighted: a name match matters far more than a tier match. */
const FIELDS: { get: (p: Product) => string; weight: number }[] = [
  { get: (p) => p.name, weight: 6 },
  { get: (p) => p.category, weight: 2 },
  { get: (p) => p.collections.join(' '), weight: 2 },
  { get: (p) => p.materialTier, weight: 2 },
  { get: (p) => p.shortDescription, weight: 1 },
];

export function searchProducts(products: Product[], rawQuery: string): SearchHit[] {
  const query = normalise(rawQuery).trim();
  if (query.length < 2) return [];

  const hits: SearchHit[] = [];

  for (const product of products) {
    let score = 0;
    for (const field of FIELDS) {
      score += fuzzyScore(normalise(field.get(product)), query) * field.weight;
    }
    if (score > 0) hits.push({ product, score });
  }

  return hits.sort((a, b) => b.score - a.score);
}

/** Suggestions shown before anything is typed. */
export const SEARCH_SUGGESTIONS = [
  'Championship belt',
  'Replica title belt',
  'Custom wrestling belt',
  '24k gold',
  'Boxing belt',
  'CNC',
] as const;
