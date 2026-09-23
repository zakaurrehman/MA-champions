import 'server-only';
import { cache } from 'react';
import { getProductsByCollection, getProductsByTier, getShopProducts } from './products';
import { ALL_BELTS_SLUG, LEAGUE_COLLECTIONS, getMaterialTiers } from './tiers';
import { MAIN_NAV, type NavGroup } from './nav';

/**
 * A collection is only LISTED — in the menus, the footer, the homepage and the
 * collections index — once it holds at least this many belts.
 *
 * Seven of the fourteen collection pages in the menu used to lead to "Nothing
 * listed here yet". A dead end costs a customer's trust, and a page with one
 * belt on it reads as a shop that is not really stocked.
 *
 * The pages themselves stay reachable at their URLs. Only EMPTY ones are also
 * hidden from Google (see the collection route), because a page with one or
 * two real belts on it is not thin content — it is just a small shelf.
 */
export const MIN_LISTED = 3;

/**
 * Belts per collection slug, computed with the SAME functions the collection
 * page uses, so a count here can never disagree with what the page shows.
 *
 * Tiers are counted last on purpose: the collection route checks tiers before
 * leagues, so when a slug is shared (Boxing is both) the tier's count is the
 * one the page actually renders.
 */
export const collectionCounts = cache(async (): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();

  counts.set(ALL_BELTS_SLUG, (await getShopProducts()).length);

  for (const league of LEAGUE_COLLECTIONS) {
    counts.set(league.slug, (await getProductsByCollection(league.id)).length);
  }
  for (const tier of await getMaterialTiers()) {
    counts.set(tier.slug, (await getProductsByTier(tier.id)).length);
  }

  return counts;
});

const COLLECTION_HREF = /^\/collections\/([^/?#]+)$/;

/** The collection slug a nav link points at, or null for any other page. */
function collectionSlug(href: string): string | null {
  return COLLECTION_HREF.exec(href)?.[1] ?? null;
}

/** True when a collection has enough belts to be offered in navigation. */
export async function isListed(slug: string): Promise<boolean> {
  return ((await collectionCounts()).get(slug) ?? 0) >= MIN_LISTED;
}

/**
 * The main navigation with under-stocked collections removed.
 *
 * Links to anything other than a collection (the builder, pricing, FAQs) are
 * never touched, and a group left with no links is dropped rather than shown
 * as an empty heading.
 */
export async function visibleNav(): Promise<NavGroup[]> {
  const counts = await collectionCounts();

  return MAIN_NAV.map((group) => ({
    ...group,
    links: group.links.filter((link) => {
      const slug = collectionSlug(link.href);
      return slug === null || (counts.get(slug) ?? 0) >= MIN_LISTED;
    }),
  })).filter((group) => group.links.length > 0);
}
