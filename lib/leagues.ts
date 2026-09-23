import type { LeagueCollection } from './types';

/**
 * League/sport collections. These are navigational routes that exist ahead of
 * inventory; lib/collectionCounts.ts keeps under-stocked ones out of menus.
 *
 * Kept free of runtime imports (the one above is type-only and is erased), so
 * plain Node scripts such as scripts/tidy-collections.ts can import it — they
 * cannot resolve the app's "@/" path alias. lib/tiers.ts re-exports it, so
 * existing imports are unchanged.
 */
export const LEAGUE_COLLECTIONS: LeagueCollection[] = [
  { id: 'nfl', name: 'Football', slug: 'football-championship-belts', blurb: 'Gridiron league and fantasy title belts' },
  { id: 'nba', name: 'Basketball', slug: 'basketball-championship-belts', blurb: 'Court championship and league belts' },
  { id: 'nhl', name: 'Hockey', slug: 'hockey-championship-belts', blurb: 'Ice league and tournament belts' },
  { id: 'mlb', name: 'Baseball', slug: 'baseball-championship-belts', blurb: 'Diamond league and season belts' },
  { id: 'wrestling', name: 'Wrestling', slug: 'wrestling-championship-belts', blurb: 'Replica title and promotion belts' },
  { id: 'boxing', name: 'Boxing', slug: 'boxing-championship-belts', blurb: 'Round-plate title belts' },
  { id: 'mma', name: 'MMA', slug: 'mma-championship-belts', blurb: 'Cage and grappling title belts' },
  { id: 'fantasy', name: 'Fantasy League', slug: 'fantasy-league-belts', blurb: 'Season trophies that get passed on' },
];
