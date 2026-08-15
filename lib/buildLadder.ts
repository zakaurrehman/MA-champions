import type { ProductVariant } from './types';

/**
 * The standard four-build ladder every belt is offered in.
 *
 * Prices are the client's confirmed build ladder. They are a STARTING POINT
 * for a new belt, not a rule — a bigger or more detailed belt costs more to
 * make, and the admin can change any of them per product.
 *
 * Compare-at is deliberately left null. A "was" price the belt never sold at
 * is a false discount claim under UK CPRs, the FTC Act and the EU UCPD, so it
 * has to be a decision someone makes, never a default that appears on its own.
 */
export const STANDARD_BUILD_LADDER: ProductVariant[] = [
  {
    id: '2mm-brass',
    name: '2mm Brass',
    salePrice: 170,
    originalPrice: null,
    stock: null,
    inStock: true,
    isDefault: false,
  },
  {
    id: '4mm-standard',
    name: '4mm Standard',
    salePrice: 270,
    originalPrice: null,
    stock: null,
    inStock: true,
    isDefault: false,
  },
  {
    id: '4mm-cnc',
    name: '4mm CNC',
    salePrice: 400,
    originalPrice: null,
    stock: null,
    inStock: true,
    isDefault: false,
  },
  {
    id: '6mm-cnc',
    name: '6mm CNC',
    salePrice: 470,
    originalPrice: null,
    stock: null,
    inStock: true,
    /*
     * The photographs show a CNC build, so that is what leads. Without a
     * default the cheapest option wins and every belt headlines at the entry
     * price against a picture of the expensive one.
     */
    isDefault: true,
  },
];

export const DEFAULT_VARIANT_LABEL = 'Build';

/** Ids are referenced by carts and saved orders, so they must never change. */
export function newVariantId(): string {
  return `build-${Date.now().toString(36)}`;
}
