/**
 * Material tier access. Same boundary rules as `lib/products.ts`.
 *
 * NOTE: every tier currently has `confirmed: false`. The price floors are a
 * draft derived from competitor pricing (see data/tiers.json `meta`) and are
 * NOT client-supplied business facts. `hasUnconfirmedPricing()` exists so the
 * UI can mark them honestly rather than presenting drafts as final.
 */

import raw from '@/data/tiers.json';
import type { MaterialTier } from './types';

async function loadTiers(): Promise<MaterialTier[]> {
  return (raw.tiers as unknown as MaterialTier[]).slice().sort((a, b) => a.order - b.order);
}

export async function getMaterialTiers(): Promise<MaterialTier[]> {
  return loadTiers();
}

export async function getTierBySlug(slug: string): Promise<MaterialTier | null> {
  const tiers = await loadTiers();
  return tiers.find((t) => t.slug === slug) ?? null;
}

/** True while any floor is still a draft. Drives the "indicative pricing" note. */
export async function hasUnconfirmedPricing(): Promise<boolean> {
  const tiers = await loadTiers();
  return tiers.some((t) => !t.confirmed);
}

/**
 * League/sport collections. These are navigational routes that exist ahead of
 * inventory — each renders an honest empty state until products land.
 */
/**
 * The catch-all shelf listing every purchasable belt. Lives here rather than in
 * the route file so components can link to it without importing a page module.
 */
export const ALL_BELTS_SLUG = 'all-championship-belts';

export { LEAGUE_COLLECTIONS } from './leagues';
