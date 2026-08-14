'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { resolvePrice, getVariants, defaultVariant } from '@/lib/pricing';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/lib/cart';
import { useToasts } from '@/lib/toast';
import PriceDisplay from './PriceDisplay';

/**
 * Interactive half of a product card: variant chips, quantity, add-to-cart and
 * View More. Split out as a client component so the card itself — image, name,
 * link — stays a server component and ships no JS for the static parts.
 */
export default function ProductCardActions({ product }: { product: Product }) {
  const variants = getVariants(product);
  const [variantId, setVariantId] = useState(() => defaultVariant(product)?.id ?? null);
  const [qty, setQty] = useState(1);

  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const push = useToasts((s) => s.push);

  const price = resolvePrice(product, variantId);
  const variant = price.variant;

  // Respect inventory when it is tracked; null stock means untracked.
  const maxQty = variant?.stock ?? null;
  const soldOut = variant ? !variant.inStock : !product.inStock;

  const add = () => {
    const image = product.images[0];
    const specLines = variant ? [`${variantLabel(product)}: ${variant.name}`] : [];

    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: image?.src ?? '',
        imageAlt: image?.alt ?? product.name,
        unitPrice: price.current,
        currency: product.currency,
        selection: variant ? { variant: variant.id } : {},
        engraving: '',
        specLines,
      },
      qty
    );

    push(`${product.name} added to cart`, { label: 'View cart', href: '/cart' });
    openCart();
  };

  return (
    <div className="mt-3">
      <PriceDisplay price={price} size="sm" />

      {/* Variant chips */}
      {variants.length > 0 && (
        <fieldset className="mt-3">
          <legend className="sr-only">{variantLabel(product)} for {product.name}</legend>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => {
              const selected = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={selected}
                  disabled={!v.inStock}
                  title={v.inStock ? formatPrice(v.salePrice, product.currency) : 'Sold out'}
                  className={`rounded-[--radius-plate] border px-2.5 py-1 font-body text-2xs font-semibold transition-colors disabled:opacity-40 ${
                    selected
                      ? 'border-primary bg-primary/10 text-link'
                      : 'border-subtle/30 text-muted hover:border-subtle/60'
                  }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Quantity + add */}
      <div className="mt-3 flex items-center gap-2">
        <div className="inline-flex shrink-0 items-center rounded-[--radius-plate] border border-subtle/25">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label={`Decrease quantity of ${product.name}`}
            className="grid h-9 w-8 place-items-center text-ink disabled:opacity-30 hover:text-link"
          >
            −
          </button>
          <span aria-live="polite" className="w-7 text-center font-body text-xs tabular-nums text-ink">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => (maxQty ? Math.min(maxQty, q + 1) : q + 1))}
            disabled={maxQty !== null && qty >= maxQty}
            aria-label={`Increase quantity of ${product.name}`}
            className="grid h-9 w-8 place-items-center text-ink disabled:opacity-30 hover:text-link"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={add}
          disabled={soldOut}
          className="min-w-0 flex-1 rounded-[--radius-plate] bg-primary px-3 py-2.5 font-display text-xs uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {soldOut ? 'Sold out' : 'Add to cart'}
        </button>
      </div>

      <Link
        href={`/products/${product.slug}`}
        className="mt-2.5 inline-flex w-full items-center justify-center rounded-[--radius-plate] border border-subtle/30 px-3 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-primary hover:text-link"
      >
        View more →
      </Link>
    </div>
  );
}

/** Belts vary by plate thickness; keep the label honest if that ever changes. */
function variantLabel(product: Product): string {
  return product.variantLabel ?? 'Size';
}
