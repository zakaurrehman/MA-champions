/**
 * DATA ACCESS BOUNDARY
 * ────────────────────
 * Every product read in the app goes through this module. Components never
 * import `data/products.json` directly.
 *
 * All functions are async even though the current source is a local file. That
 * is deliberate: when this is swapped for the Shopify Storefront API or Sanity,
 * only the bodies below change — no call site, no component, no page.
 *
 * To swap the source:
 *   1. Replace `loadProducts()` with your fetch/query.
 *   2. Map the response onto the `Product` type in `lib/types.ts`.
 *   3. Leave every exported function signature exactly as it is.
 */

import { cache } from 'react';
import raw from '@/data/products.json';
import { db } from './db';
import type { Product, ProductVariant, ProductImage, ProductSpecs } from './types';

/** Shape of a `products` row, before mapping onto the domain type. */
interface ProductRow {
  slug: string;
  name: string;
  category: string;
  collections: string[];
  material_tier: string;
  price: string | number;
  original_price: string | number | null;
  sale_price: string | number | null;
  currency: string;
  in_stock: boolean;
  featured: boolean;
  shop_visible: boolean;
  custom_gallery: boolean;
  short_description: string;
  description: string;
  variant_label: string | null;
  specs: ProductSpecs;
  variants: ProductVariant[];
  images: ProductImage[];
}

/** NUMERIC comes back from Postgres as a string to preserve exactness. */
const num = (value: string | number | null): number | null =>
  value === null ? null : typeof value === 'number' ? value : Number(value);

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    category: row.category,
    collections: row.collections ?? [],
    materialTier: row.material_tier,
    price: num(row.price) ?? 0,
    originalPrice: num(row.original_price),
    salePrice: num(row.sale_price),
    currency: row.currency,
    inStock: row.in_stock,
    featured: row.featured,
    rating: null,
    reviewCount: 0,
    shortDescription: row.short_description,
    description: row.description,
    variantLabel: row.variant_label ?? undefined,
    specs: row.specs ?? {},
    variants: row.variants ?? [],
    images: row.images ?? [],
    visibility: {
      shop: row.shop_visible,
      customGallery: row.custom_gallery,
      reason: '',
    },
  } as Product;
}

/**
 * Single point of ingestion.
 *
 * Reads the database when one is configured, and falls back to the JSON seed
 * otherwise — so local development, preview builds and any deploy without
 * DATABASE_URL still render the full catalogue instead of an empty shop.
 *
 * Wrapped in React's `cache` so a page rendering a grid, a breadcrumb and
 * structured data issues one query, not three.
 */
const loadProducts = cache(async (): Promise<Product[]> => {
  const sql = db();

  if (sql) {
    try {
      const rows = (await sql`
        SELECT slug, name, category, collections, material_tier,
               price, original_price, sale_price, currency,
               in_stock, featured, shop_visible, custom_gallery,
               short_description, description,
               variant_label, specs, variants, images
        FROM products
        ORDER BY sort_order ASC, created_at DESC
      `) as unknown as ProductRow[];

      // An empty table means "not seeded yet", not "no products". Falling back
      // keeps the shop populated until `npm run migrate` has been run.
      if (rows.length > 0) return rows.map(rowToProduct);
    } catch (error) {
      // A missing table or an unreachable database must not take the shop down.
      console.error('[products] database read failed, using JSON seed:', error);
    }
  }

  return raw.products as unknown as Product[];
});

/**
 * Every product, including ones hidden from the shop.
 * Use only for admin/diagnostic paths — never to build a public grid.
 */
export async function getAllProducts(): Promise<Product[]> {
  return loadProducts();
}

/**
 * The only safe source for public shop surfaces: collections, search,
 * sitemap, product routes.
 */
export async function getShopProducts(): Promise<Product[]> {
  const all = await loadProducts();
  return all.filter((p) => p.visibility.shop);
}

/**
 * Products for the homepage rail.
 *
 * Anything flagged `featured` leads, then everything else follows. Filtering
 * on the flag alone meant the homepage showed only the three products someone
 * had remembered to tick, while eleven others sat invisible — a curation field
 * should reorder the shelf, not empty it.
 *
 * Omit `limit` to return the whole catalogue.
 */
export async function getFeaturedProducts(limit?: number): Promise<Product[]> {
  const shop = await getShopProducts();
  const ordered = [
    ...shop.filter((p) => p.featured),
    ...shop.filter((p) => !p.featured),
  ];
  return typeof limit === 'number' ? ordered.slice(0, limit) : ordered;
}

/** Resolves only shop-visible products, so hidden slugs 404 rather than leak. */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const shop = await getShopProducts();
  return shop.find((p) => p.slug === slug) ?? null;
}

export async function getProductsByCollection(collection: string): Promise<Product[]> {
  const shop = await getShopProducts();
  return shop.filter((p) => p.collections.includes(collection));
}

/**
 * Products for a material tier page.
 *
 * Matches the product's own tier OR a tier tagged in its `collections`. A belt
 * belongs to exactly one tier for pricing, but it can legitimately belong on
 * more than one tier's shelf: our CNC belts are also genuinely 24k gold
 * plated, and a shopper browsing "24K Gold" expects to see them. Without this,
 * that collection rendered empty while three gold-plated belts sat in the
 * catalogue.
 */
export async function getProductsByTier(tier: string): Promise<Product[]> {
  const shop = await getShopProducts();
  return shop.filter((p) => p.materialTier === tier || p.collections.includes(tier));
}

/**
 * Related belts: same tier first, then same category, excluding the product
 * being viewed. Shop-visible only.
 */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const shop = await getShopProducts();
  const others = shop.filter((p) => p.id !== product.id);

  const sameTier = others.filter((p) => p.materialTier === product.materialTier);
  const sameCategory = others.filter(
    (p) => p.materialTier !== product.materialTier && p.category === product.category
  );

  return [...sameTier, ...sameCategory, ...others]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, limit);
}

/**
 * Past work shown on /custom. These are real belts we built, presented as
 * commissions rather than stock — several carry client-supplied artwork and
 * are intentionally not purchasable.
 */
export async function getCustomGalleryProducts(): Promise<Product[]> {
  const all = await loadProducts();
  return all.filter((p) => p.visibility.customGallery);
}

/** Effective price after any sale, in minor-unit-safe whole currency. */
export function effectivePrice(product: Product): number {
  return product.salePrice ?? product.price;
}

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
