/**
 * Geometry and materials for the belt preview.
 *
 * Every silhouette is drawn in the same normalised box (roughly -105..105 by
 * -96..96, centred on the origin), so the renderer can place and scale them
 * identically — and side plates are simply the same path at ~0.42 scale, which
 * is how real belts are made: the sides echo the centre.
 */

import type { LeatherId, PlateMaterialId, SilhouetteId, StitchId } from '@/lib/builder';

export const SILHOUETTE_PATHS: Record<SilhouetteId, string> = {
  'classic-oval':
    'M0,-86 C56,-86 101,-47 101,0 C101,47 56,86 0,86 C-56,86 -101,47 -101,0 C-101,-47 -56,-86 0,-86 Z',

  winged:
    'M0,-84 C34,-84 66,-76 96,-66 L118,-34 C104,-26 99,-8 99,8 C99,52 55,86 0,86 C-55,86 -99,52 -99,8 C-99,-8 -104,-26 -118,-34 L-96,-66 C-66,-76 -34,-84 0,-84 Z',

  'domed-globe':
    'M-94,6 C-94,-46 -52,-88 0,-88 C52,-88 94,-46 94,6 L94,52 C94,72 78,88 58,88 L-58,88 C-78,88 -94,72 -94,52 Z',

  'modern-faceted': 'M-56,-88 L56,-88 L102,-44 L102,44 L56,88 L-56,88 L-102,44 L-102,-44 Z',

  'boxing-round': 'M-88,0 A88,88 0 1,0 88,0 A88,88 0 1,0 -88,0 Z',

  fantasy:
    'M0,-96 L26,-56 L70,-68 L60,-24 L104,0 L60,24 L70,68 L26,56 L0,96 L-26,56 L-70,68 L-60,24 L-104,0 L-60,-24 L-70,-68 L-26,-56 Z',
};

export interface GradientStop {
  offset: string;
  color: string;
}

/**
 * Metal finishes. Each is a raking gradient rather than a flat fill, because
 * a plate never reads as one colour — it catches light across its face.
 */
export const PLATE_GRADIENTS: Record<PlateMaterialId, GradientStop[]> = {
  brass: [
    { offset: '0%', color: '#6b4f1c' },
    { offset: '22%', color: '#a8802c' },
    { offset: '46%', color: '#d9b45c' },
    { offset: '68%', color: '#a8802c' },
    { offset: '100%', color: '#6b4f1c' },
  ],
  zinc: [
    { offset: '0%', color: '#6f767c' },
    { offset: '22%', color: '#a8aeb4' },
    { offset: '46%', color: '#e2e6e9' },
    { offset: '68%', color: '#a8aeb4' },
    { offset: '100%', color: '#6f767c' },
  ],
  '24k-gold': [
    { offset: '0%', color: '#7e5512' },
    { offset: '20%', color: '#c9962e' },
    { offset: '45%', color: '#f4dc94' },
    { offset: '70%', color: '#c9962e' },
    { offset: '100%', color: '#7e5512' },
  ],
  // CNC is machined rather than cast, so the highlights are tighter and the
  // shadows deeper — more contrast across the same ramp.
  cnc: [
    { offset: '0%', color: '#4c3308' },
    { offset: '16%', color: '#b3831f' },
    { offset: '38%', color: '#fbeab4' },
    { offset: '52%', color: '#d8a838' },
    { offset: '74%', color: '#8f6516' },
    { offset: '100%', color: '#4c3308' },
  ],
};

export const LEATHER_HEX: Record<LeatherId, string> = {
  black: '#141210',
  oxblood: '#5e141c',
  brown: '#5a3921',
  white: '#e8e3d9',
  blue: '#1b3a6b',
  red: '#8c1c1c',
};

/** Slightly darker edge tone, so the strap has a sealed painted edge. */
export const LEATHER_EDGE: Record<LeatherId, string> = {
  black: '#000000',
  oxblood: '#3a0c11',
  brown: '#38220f',
  white: '#c3bdb0',
  blue: '#0f2444',
  red: '#5c0f0f',
};

const STITCH_HEX: Record<Exclude<StitchId, 'matching'>, string> = {
  gold: '#c9962e',
  white: '#efe9dd',
  black: '#100e0c',
  red: '#9e1f1f',
};

/** "Matching" stitching is a tone-on-tone thread, not an invisible one. */
export function stitchColour(stitch: StitchId, leather: LeatherId): string {
  if (stitch === 'matching') {
    return leather === 'white' || leather === 'brown' ? '#8d8577' : '#6d6459';
  }
  return STITCH_HEX[stitch];
}

/** Where side plates sit, as x-offsets from centre, per plate count. */
export function sidePlateOffsets(count: 1 | 3 | 5): number[] {
  if (count === 1) return [];
  if (count === 3) return [-215, 215];
  return [-195, 195, -370, 370];
}
