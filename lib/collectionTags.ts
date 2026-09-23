import tiersRaw from '@/data/tiers.json';
import { LEAGUE_COLLECTIONS } from './tiers';

/**
 * The only values a product's `collections` may contain.
 *
 * `collections` used to be a free-text box in the admin panel ("comma
 * separated"). People pasted product descriptions into it, and the commas
 * split them into junk "categories" — 25 of 80 belts carried sentence
 * fragments like "brilliant 24K gold finish". Worse, belts added that way were
 * never tagged into a real collection, so the Wrestling page showed 17 of the
 * 80 wrestling belts. Picking from this list is what stops both.
 *
 * Every id here is something a collection page actually reads:
 *  - sport ids, read by the sport collection pages;
 *  - material tier ids, read by the material pages. A belt is always listed
 *    under its OWN tier; ticking another one also lists it there, e.g. a CNC
 *    belt with 24K gold plating under "24K Gold" as well.
 *
 * No `server-only`: the admin form (a client component) renders the list, and
 * the API validates against the same list.
 */

export interface CollectionTag {
  id: string;
  label: string;
  group: 'sport' | 'material';
}

const SPORT_TAGS: CollectionTag[] = LEAGUE_COLLECTIONS.map((league) => ({
  id: league.id,
  label: league.name,
  group: 'sport',
}));

const sportIds = new Set(SPORT_TAGS.map((t) => t.id));

/*
 * Tiers whose id is also a sport id (Boxing) are left out here: one "boxing"
 * tag already serves both pages, and listing it twice would be confusing.
 */
const MATERIAL_TAGS: CollectionTag[] = (tiersRaw.tiers as { id: string; name: string }[])
  .filter((tier) => !sportIds.has(tier.id))
  .map((tier) => ({ id: tier.id, label: tier.name, group: 'material' }));

export const COLLECTION_TAGS: CollectionTag[] = [...SPORT_TAGS, ...MATERIAL_TAGS];

const ALLOWED = new Set(COLLECTION_TAGS.map((t) => t.id));

/** True for a value a collection page actually reads. */
export function isCollectionTag(value: string): boolean {
  return ALLOWED.has(value);
}

/**
 * Keeps only known tags, de-duplicated, in a stable order. Anything else —
 * pasted descriptions, typos, retired tags — is dropped.
 */
export function cleanCollections(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const wanted = new Set(value.map((v) => String(v).trim()));
  return COLLECTION_TAGS.map((t) => t.id).filter((id) => wanted.has(id));
}
