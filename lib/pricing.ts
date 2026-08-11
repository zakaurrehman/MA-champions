/**
 * CENTRALISED PRICING — the single source of truth for what a belt costs.
 *
 * Every surface (cards, product page, cart, quote, JSON-LD) resolves price
 * through here. Nothing computes a discount inline. That matters because a
 * discount shown on a card and a different one at checkout is the kind of bug
 * that costs money and trust.
 *
 * Resolution order:
 *   current  = selected variant's salePrice  →  product.salePrice  →  product.price
 *   original = selected variant's originalPrice → product.originalPrice → null
 *
 * BACKWARD COMPATIBILITY: products predating variants and originalPrice have
 * neither field. Both are optional, and a product with only `price` resolves
 * to that price with no discount and no strikethrough.
 */

import type { Product, ProductVariant } from './types';

export interface ResolvedPrice {
  /** The price actually charged. */
  current: number;
  /** Compare-at price, or null when there is no genuine higher price. */
  original: number | null;
  /** Whole-number percentage off, or null when there is no discount. */
  discountPercent: number | null;
  currency: string;
  /** The variant this resolved to, if any. */
  variant: ProductVariant | null;
}

/** Variants a product actually has. Always an array, never undefined. */
export function getVariants(product: Product): ProductVariant[] {
  return product.variants ?? [];
}

export function hasVariants(product: Product): boolean {
  return getVariants(product).length > 0;
}

/**
 * The variant selected by default: the one flagged `isDefault`, else the first
 * in stock, else the first listed.
 *
 * The flag matters because variants are listed cheapest-first for scanning,
 * but the belt in the photographs is usually a mid-ladder build. Without it,
 * every card would headline the entry price against a picture of something
 * dearer.
 */
export function defaultVariant(product: Product): ProductVariant | null {
  const variants = getVariants(product);
  if (variants.length === 0) return null;
  return (
    variants.find((v) => v.isDefault && v.inStock) ??
    variants.find((v) => v.isDefault) ??
    variants.find((v) => v.inStock) ??
    variants[0] ??
    null
  );
}

export function findVariant(product: Product, variantId?: string | null): ProductVariant | null {
  if (!variantId) return null;
  return getVariants(product).find((v) => v.id === variantId) ?? null;
}

/**
 * Discount as a whole percentage.
 *
 * Returns null rather than 0 or a negative number when there is no genuine
 * saving, so callers can simply check for null instead of guarding against
 * "0% OFF" or "-12% OFF" badges.
 */
export function discountPercent(original: number | null, current: number): number | null {
  if (original === null || original <= 0) return null;
  if (original <= current) return null;
  const pct = Math.round(((original - current) / original) * 100);
  return pct > 0 ? pct : null;
}

/**
 * Resolve the authoritative price for a product, optionally for a variant.
 *
 * Pass a variantId to price that variant. Pass nothing and, if the product has
 * variants, the default variant is priced — so a card never shows the base
 * price for a product that can only be bought in priced variants.
 */
export function resolvePrice(product: Product, variantId?: string | null): ResolvedPrice {
  const variant = findVariant(product, variantId) ?? defaultVariant(product);

  const current = variant
    ? variant.salePrice
    : (product.salePrice ?? product.price);

  const original = variant
    ? variant.originalPrice
    : (product.originalPrice ?? null);

  return {
    current,
    original,
    discountPercent: discountPercent(original, current),
    currency: product.currency,
    variant,
  };
}

/**
 * Price range across all variants, for listing cards on multi-variant products.
 * Returns null for simple products.
 */
export function priceRange(product: Product): { min: number; max: number } | null {
  const variants = getVariants(product);
  if (variants.length === 0) return null;
  const prices = variants.map((v) => v.salePrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? null : { min, max };
}

/**
 * AUTHORITATIVE server-side price lookup.
 *
 * Checkout must never trust a price sent by the browser — a customer can edit
 * it in devtools. Callers send productId + variantId + quantity; this recomputes
 * the total from the catalogue and returns null if either id is unknown.
 */
export function authoritativeLineTotal(
  product: Product,
  variantId: string | null,
  quantity: number
): { unitPrice: number; total: number; variant: ProductVariant | null } | null {
  if (!Number.isInteger(quantity) || quantity < 1) return null;

  if (variantId) {
    const variant = findVariant(product, variantId);
    // Unknown variant id is a tampering signal, not a fallback case.
    if (!variant) return null;
    return { unitPrice: variant.salePrice, total: variant.salePrice * quantity, variant };
  }

  // A product with variants must be bought as a variant.
  if (hasVariants(product)) return null;

  const unitPrice = product.salePrice ?? product.price;
  return { unitPrice, total: unitPrice * quantity, variant: null };
}
