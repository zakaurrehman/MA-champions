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

/**
 * A priced product variant — e.g. plate thickness 4mm / 6mm / 8mm.
 *
 * Variants carry their OWN pricing. When one is selected it overrides the
 * product-level price entirely, which is what stops a customer being charged
 * the base price for a more expensive option.
 *
 * `originalPrice` is a compare-at figure and is nullable: a product that has
 * never sold higher must not display a struck-through price, because that is a
 * false discount claim under UK CPRs, the FTC Act and the EU UCPD.
 */
export interface ProductVariant {
  /**
   * Pre-selected build. Without this the cheapest option leads, which would
   * headline every belt at the entry price even though the photographs show a
   * CNC build. Falls back to first-in-stock when no variant is flagged.
   */
  isDefault?: boolean;
  id: string;
  /** Customer-facing label, e.g. "6mm". */
  name: string;
  /** Compare-at price. null = no discount shown for this variant. */
  originalPrice: number | null;
  /** The price actually charged. */
  salePrice: number;
  /** null = not inventory-tracked. */
  stock: number | null;
  inStock: boolean;
}

/** Per-product overrides for the global fulfilment defaults in lib/site.ts. */
export interface ProductFulfilment {
  processingTime?: string | null;
  shippingTime?: string | null;
}

export interface ProductWarranty {
  available: boolean;
  duration: string | null;
  replacement: boolean;
  exchange: boolean;
  description: string | null;
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

  /**
   * Compare-at price for the product as a whole. Optional and nullable so
   * every existing product keeps working untouched — see lib/pricing.ts.
   */
  originalPrice?: number | null;

  /**
   * Priced variants. Absent or empty means this is a simple product and the
   * product-level price applies.
   */
  variants?: ProductVariant[];

  /** What the variants represent, e.g. "Plate thickness". Defaults to "Size". */
  variantLabel?: string;

  fulfilment?: ProductFulfilment;
  warranty?: ProductWarranty | null;
}

/**
 * Structured attributes for the /pricing comparison table.
 *
 * The string fields describe the materials themselves, which is safe to
 * publish. `weight` and `leadTime` are business facts we do not hold, so they
 * are nullable and render as a dash rather than a guess.
 */
export interface TierCompare {
  plateMetal: string;
  plating: string;
  etching: string;
  leather: string;
  stones: string;
  bestFor: string;
  weight: string | null;
  leadTime: string | null;
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
  compare: TierCompare;
  /** false until the client signs off on the price floor. */
  confirmed: boolean;
}

export interface LeagueCollection {
  id: string;
  name: string;
  slug: string;
  blurb: string;
}
