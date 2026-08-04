/**
 * Domain types for the storefront.
 *
 * These are deliberately source-agnostic. Nothing here mentions JSON, Shopify
 * or Sanity — components import only these types, so the backing store can be
 * swapped in `lib/products.ts` without touching a single component.
 */

export type MaterialTierId =
  | 'brass'
  | 'boxing'
  | 'zinc'
  | '24k-gold'
  | 'hd-cnc-premium'
  | 'fully-custom';

export type CategoryId =
  | 'wrestling'
  | 'boxing'
  | 'mma'
  | 'nfl'
  | 'nba'
  | 'nhl'
  | 'mlb'
  | 'fantasy'
  | 'corporate'
  | 'custom';

export interface ProductImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  /**
   * Precomputed base64 blur. next/image can only derive this for static
   * imports, and our paths come from JSON — so `npm run blur` writes it.
   * Optional because a freshly added image has none until the script runs.
   */
  blurDataURL?: string;
}

export interface ProductSpecs {
  plateMaterial: string;
  plateThickness: string;
  plating: string;
  leatherType: string;
  leatherColour: string;
  plateCount: number;
  weight: string;
  size: string;
  stones: string;
}

/**
 * Controls where a product may appear. A product with `shop: false` must never
 * reach a collection grid, search index, sitemap or product route.
 *
 * Currently every product is shop:false because the supplied photography shows
 * live third-party marks. See PLACEHOLDER-IMAGES.md.
 */
export interface ProductVisibility {
  shop: boolean;
  customGallery: boolean;
  reason?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategoryId;
  collections: string[];
  materialTier: MaterialTierId;
  price: number;
  salePrice: number | null;
  currency: string;
  priceIncludesShipping?: boolean;
  inStock: boolean;
  featured: boolean;
  /** null until real reviews exist. Never fabricate these. */
  rating: number | null;
  reviewCount: number;
  shortDescription: string;
  description: string;
  specs: ProductSpecs;
  images: ProductImage[];
  visibility: ProductVisibility;
  /**
   * Variant size ids this belt can be built in. Omit to mean "all sizes",
   * which is the current default — every belt we make is offered in the full
   * size range until a product says otherwise.
   */
  availableSizes?: string[];
}

export interface MaterialTier {
  id: MaterialTierId;
  name: string;
  slug: string;
  order: number;
  priceFloor: number;
  competitorFloor: number;
  undercutPct: number;
  anchoredToRealProduct?: string;
  blurb: string;
  specBullets: string[];
  /** false until the client signs off on the price floor. */
  confirmed: boolean;
}

export interface LeagueCollection {
  id: string;
  name: string;
  slug: string;
  blurb: string;
}
