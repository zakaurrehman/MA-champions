/**
 * Belt Builder — options, state and pricing.
 *
 * Pricing note: the base price for each plate material comes from the real
 * tier floors in data/tiers.json, so the running total genuinely moves as you
 * change material. Plate count, size, engraving and artwork modifiers are all
 * zero and unconfirmed — same rule as data/variants.json. The UI says so
 * rather than implying the total is final.
 */

import tiersRaw from '@/data/tiers.json';

export type SilhouetteId =
  | 'classic-oval'
  | 'winged'
  | 'domed-globe'
  | 'modern-faceted'
  | 'boxing-round'
  | 'fantasy';

export type PlateMaterialId = 'brass' | 'zinc' | '24k-gold' | 'cnc';
export type PlateCount = 1 | 3 | 5;
/** Strap size only. Plate thickness is chosen via plateMaterial/build, not here. */
export type BuildSizeId = 'adult' | 'kids' | 'mini';
export type LeatherId = 'black' | 'oxblood' | 'brown' | 'white' | 'blue' | 'red';
export type StitchId = 'matching' | 'gold' | 'white' | 'black' | 'red';

export interface Option<T extends string> {
  id: T;
  name: string;
  blurb?: string;
  swatch?: string;
}

export const SILHOUETTES: Option<SilhouetteId>[] = [
  { id: 'classic-oval', name: 'Classic Oval', blurb: 'The traditional world-title shape' },
  { id: 'winged', name: 'Winged', blurb: 'Flared shoulders, heavy presence' },
  { id: 'domed-globe', name: 'Domed Globe', blurb: 'Arched crown over a globe field' },
  { id: 'modern-faceted', name: 'Modern Faceted', blurb: 'Angular, machine-cut edges' },
  { id: 'boxing-round', name: 'Boxing Round', blurb: 'Full circle, sanctioning-body style' },
  { id: 'fantasy', name: 'Fantasy', blurb: 'Ornate points for league trophies' },
];

export const PLATE_MATERIALS: Option<PlateMaterialId>[] = [
  { id: 'brass', name: 'Brass', blurb: 'Lightweight, etched detail' },
  { id: 'zinc', name: 'Zinc', blurb: 'Deep-etched, sharper relief' },
  { id: '24k-gold', name: '24K Gold', blurb: 'True gold plating' },
  { id: 'cnc', name: 'CNC / HD', blurb: 'Machine-cut from solid stock' },
];

export const PLATE_COUNTS: { id: PlateCount; name: string; blurb: string }[] = [
  { id: 1, name: '1 plate', blurb: 'Centre plate only' },
  { id: 3, name: '3 plates', blurb: 'Centre plus two side plates' },
  { id: 5, name: '5 plates', blurb: 'Centre plus four side plates' },
];

export const BUILD_SIZES: Option<BuildSizeId>[] = [
  { id: 'adult', name: 'Adult', blurb: 'Standard adult strap' },
  { id: 'kids', name: 'Kids', blurb: 'Scaled for children' },
  { id: 'mini', name: 'Mini', blurb: 'Display size, not wearable' },
];

export const LEATHERS: Option<LeatherId>[] = [
  { id: 'black', name: 'Black', swatch: '#141210' },
  { id: 'oxblood', name: 'Oxblood', swatch: '#5e141c' },
  { id: 'brown', name: 'Brown', swatch: '#5a3921' },
  { id: 'white', name: 'White', swatch: '#e8e3d9' },
  { id: 'blue', name: 'Blue', swatch: '#1b3a6b' },
  { id: 'red', name: 'Red', swatch: '#8c1c1c' },
];

export const STITCHES: Option<StitchId>[] = [
  { id: 'matching', name: 'Matching', swatch: 'transparent' },
  { id: 'gold', name: 'Gold', swatch: '#c9962e' },
  { id: 'white', name: 'White', swatch: '#efe9dd' },
  { id: 'black', name: 'Black', swatch: '#100e0c' },
  { id: 'red', name: 'Red', swatch: '#9e1f1f' },
];

export const ENGRAVING_MAX = 24;

/** Uploaded artwork. Bytes live in memory only — see saveBuild(). */
export interface ArtworkMeta {
  name: string;
  type: string;
  size: number;
  /** Object URL or data URL for preview. Not persisted. */
  previewUrl?: string;
}

export interface BuildState {
  silhouette: SilhouetteId;
  plateMaterial: PlateMaterialId;
  plateCount: PlateCount;
  size: BuildSizeId;
  leather: LeatherId;
  stitch: StitchId;
  artwork: ArtworkMeta | null;
  engraving: string;
}

export const DEFAULT_BUILD: BuildState = {
  silhouette: 'classic-oval',
  plateMaterial: 'zinc',
  plateCount: 3,
  size: 'adult',
  leather: 'black',
  stitch: 'matching',
  artwork: null,
  engraving: '',
};

/* -- Pricing ------------------------------------------------------------- */

interface TierRow {
  id: string;
  priceFloor: number;
  confirmed: boolean;
}

const TIERS = tiersRaw.tiers as TierRow[];

/** Builder material -> the tier whose floor sets its base price. */
const MATERIAL_TO_TIER: Record<PlateMaterialId, string> = {
  brass: 'brass',
  zinc: 'zinc',
  '24k-gold': '24k-gold',
  cnc: 'hd-cnc-premium',
};

export function basePriceFor(material: PlateMaterialId): number {
  const tier = TIERS.find((t) => t.id === MATERIAL_TO_TIER[material]);
  return tier?.priceFloor ?? 0;
}

/**
 * TODO: every modifier below is 0 pending client confirmation. The mechanism
 * is live — set real values and the running total starts moving.
 */
export const BUILD_MODIFIERS = {
  plateCount: { 1: 0, 3: 0, 5: 0 } as Record<PlateCount, number>,
  size: { adult: 0, kids: 0, mini: 0 } as Record<BuildSizeId, number>,
  engraving: 0,
  artwork: 0,
  confirmed: false,
};

export function computeBuildPrice(build: BuildState): number {
  let total = basePriceFor(build.plateMaterial);
  total += BUILD_MODIFIERS.plateCount[build.plateCount] ?? 0;
  total += BUILD_MODIFIERS.size[build.size] ?? 0;
  if (build.engraving.trim()) total += BUILD_MODIFIERS.engraving;
  if (build.artwork) total += BUILD_MODIFIERS.artwork;
  return Math.max(0, total);
}

/** True while any builder modifier or tier floor is still a draft. */
export function buildPriceIsIndicative(): boolean {
  return !BUILD_MODIFIERS.confirmed || TIERS.some((t) => !t.confirmed);
}

/* -- Human-readable spec -------------------------------------------------- */

const nameOf = <T extends string>(list: Option<T>[], id: T) =>
  list.find((o) => o.id === id)?.name ?? id;

export function describeBuild(build: BuildState): [string, string][] {
  const rows: [string, string][] = [
    ['Style', nameOf(SILHOUETTES, build.silhouette)],
    ['Plate material', nameOf(PLATE_MATERIALS, build.plateMaterial)],
    ['Plate count', PLATE_COUNTS.find((p) => p.id === build.plateCount)?.name ?? ''],
    ['Size', nameOf(BUILD_SIZES, build.size)],
    ['Leather', nameOf(LEATHERS, build.leather)],
    ['Stitching', nameOf(STITCHES, build.stitch)],
    ['Artwork', build.artwork ? build.artwork.name : 'None supplied'],
    ['Engraving', build.engraving.trim() || 'None'],
  ];
  return rows;
}

/* -- Persistence ---------------------------------------------------------- */

const STORAGE_KEY = 'ma-build';

/**
 * Saves everything EXCEPT the artwork bytes.
 *
 * A 5MB data URL would blow the ~5MB localStorage quota and throw, losing the
 * whole build. We keep the file's name/type/size so the review step can still
 * show what was attached, and tell the visitor to re-attach after a reload.
 */
export function saveBuild(build: BuildState): void {
  try {
    const { artwork, ...rest } = build;
    const safe = {
      ...rest,
      artwork: artwork ? { name: artwork.name, type: artwork.type, size: artwork.size } : null,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // Storage full or unavailable — the build stays in memory, which is fine.
  }
}

export function loadBuild(): BuildState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...DEFAULT_BUILD, ...(JSON.parse(raw) as Partial<BuildState>) };
  } catch {
    return null;
  }
}

export function clearBuild(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
