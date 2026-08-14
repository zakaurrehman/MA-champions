'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import {
  computePrice,
  defaultSelection,
  describeSelection,
  getEngravingConfig,
  getVariantGroups,
  hasUnconfirmedModifiers,
} from '@/lib/variants';
import { useCart } from '@/lib/cart';
import { useToasts } from '@/lib/toast';
import { resolvePrice, getVariants, defaultVariant } from '@/lib/pricing';
import { site, whatsAppHref } from '@/lib/site';
import { recordOrder } from '@/lib/recordOrder';
import PriceDisplay from './PriceDisplay';
import ProductVariantPicker from './ProductVariantPicker';
import VariantSelector from './VariantSelector';
import SizeGuideModal from './SizeGuideModal';
import { WhatsAppIcon } from '@/components/ui/Icons';

/** Keeps quantity within 1..stock, where stock is tracked. */
function clampQty(value: number, max: number | null): number {
  const atLeastOne = Math.max(1, value);
  return max === null ? atLeastOne : Math.min(atLeastOne, max);
}

export default function BuyBox({ product }: { product: Product }) {
  const groups = getVariantGroups();
  const engravingCfg = getEngravingConfig();

  const productVariants = getVariants(product);
  const [variantId, setVariantId] = useState(() => defaultVariant(product)?.id ?? null);
  const [selection, setSelection] = useState(() => defaultSelection());
  const [engraving, setEngraving] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const pushToast = useToasts((s) => s.push);

  /*
   * All pricing goes through lib/pricing.ts, so a selected variant's price
   * overrides the product's. Recomputing on variantId is what makes the figure
   * update instantly, with no reload.
   */
  const resolved = useMemo(() => resolvePrice(product, variantId), [product, variantId]);

  const variantPrice = resolved.current;
  const unitPrice = useMemo(
    () => computePrice(variantPrice, selection, engraving),
    [variantPrice, selection, engraving]
  );

  const specLines = useMemo(() => {
    const lines = describeSelection(selection, engraving);
    if (resolved.variant) {
      lines.unshift(`${product.variantLabel ?? 'Size'}: ${resolved.variant.name}`);
    }
    return lines;
  }, [selection, engraving, resolved.variant, product.variantLabel]);

  const maxQty = resolved.variant?.stock ?? null;
  const soldOut = resolved.variant ? !resolved.variant.inStock : !product.inStock;
  const indicative = hasUnconfirmedModifiers();

  /* Displayed price includes any option modifiers, so rebuild the shape
     PriceDisplay expects rather than showing a stale variant-only figure. */
  const displayPrice = {
    ...resolved,
    current: unitPrice,
    discountPercent:
      resolved.original !== null && resolved.original > unitPrice
        ? Math.round(((resolved.original - unitPrice) / resolved.original) * 100)
        : null,
  };

  const handleAdd = () => {
    const image = product.images[0];
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: image?.src ?? '',
        imageAlt: image?.alt ?? product.name,
        unitPrice,
        currency: product.currency,
        selection,
        engraving,
        specLines,
      },
      quantity
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);

    pushToast(
      `${quantity} × ${product.name} added to cart`,
      { label: 'View cart', href: '/cart' }
    );
    openCart();
  };

  const waMessage = [
    `Hi, I'd like to order the ${product.name}.`,
    ...specLines,
    `Quantity: ${quantity}`,
    `Listed total: ${formatPrice(unitPrice * quantity, product.currency)}`,
  ].join('\n');
  const waHref = whatsAppHref(waMessage);

  return (
    <div>
      {/* Live price — announced so the change is not silent to screen readers */}
      <div aria-live="polite" className="flex flex-wrap items-baseline gap-3">
        <PriceDisplay price={displayPrice} size="lg" />
        {product.priceIncludesShipping && (
          <span className="font-body text-2xs uppercase tracking-[0.14em] text-subtle">
            Shipping included
          </span>
        )}
      </div>

      {/* Priced variants drive the figure above */}
      {productVariants.length > 0 && (
        <div className="mt-7">
          <ProductVariantPicker
            label={product.variantLabel ?? 'Size'}
            variants={productVariants}
            value={variantId}
            currency={product.currency}
            onChange={setVariantId}
          />
        </div>
      )}

      {indicative && (
        <p className="mt-2 text-2xs leading-relaxed text-subtle">
          Options shown do not change this price yet — your final total is confirmed on your
          written quote.
        </p>
      )}

      {/* Variants */}
      <div className="mt-8 flex flex-col gap-7">
        {groups.map((group) => (
          <div key={group.id}>
            {group.id === 'size' && (
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="float-right font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link underline-offset-4 hover:text-link-hover hover:underline"
              >
                Size guide
              </button>
            )}
            <VariantSelector
              group={group}
              value={selection[group.id] ?? ''}
              onChange={(optionId) =>
                setSelection((prev) => ({ ...prev, [group.id]: optionId }))
              }
            />
          </div>
        ))}

        {/* Engraving */}
        <div>
          <label
            htmlFor="engraving"
            className="mb-3 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle"
          >
            {engravingCfg.label}
          </label>
          <input
            id="engraving"
            type="text"
            value={engraving}
            maxLength={engravingCfg.maxLength}
            onChange={(e) => setEngraving(e.target.value)}
            placeholder="Name or text"
            className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-4 py-3 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none"
          />
          <div className="mt-2 flex justify-between gap-4">
            <span className="text-2xs text-muted">{engravingCfg.hint}</span>
            <span aria-live="polite" className="shrink-0 text-2xs tabular-nums text-subtle">
              {engraving.length}/{engravingCfg.maxLength}
            </span>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label
            htmlFor="quantity"
            className="mb-3 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle"
          >
            Quantity
          </label>
          <div className="inline-flex items-center rounded-[--radius-plate] border border-subtle/25">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="grid h-11 w-11 place-items-center text-ink hover:text-link"
            >
              −
            </button>
            <input
              id="quantity"
              type="number"
              min={1}
              max={maxQty ?? undefined}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  clampQty(Math.max(1, Number(e.target.value) || 1), maxQty)
                )
              }
              className="h-11 w-14 border-x border-subtle/25 bg-transparent text-center font-body text-sm tabular-nums text-ink focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => clampQty(q + 1, maxQty))}
              disabled={maxQty !== null && quantity >= maxQty}
              aria-label="Increase quantity"
              className="grid h-11 w-11 place-items-center text-ink disabled:opacity-30 hover:text-link"
            >
              +
            </button>
          </div>
          {maxQty !== null && (
            <p className="mt-2 text-2xs text-muted">{maxQty} in stock</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className="bg-primary plate-sheen w-full rounded-[--radius-plate] px-7 py-4 font-display text-base uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {soldOut ? 'Sold out' : added ? 'Added to cart' : 'Add to cart'}
        </button>

        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              void recordOrder({
                kind: 'product',
                items: [
                  {
                    slug: product.slug,
                    variantId: resolved.variant?.id ?? null,
                    quantity,
                    specLines,
                  },
                ],
              })
            }
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-[--radius-plate] border border-subtle/40 px-7 py-4 font-display text-base uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-link-hover"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Buy on WhatsApp
          </a>
        ) : (
          /* No number supplied yet — never render a dead WhatsApp button. */
          <a
            href="/contact"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-[--radius-plate] border border-subtle/40 px-7 py-4 font-display text-base uppercase tracking-wide text-ink transition-colors hover:border-primary hover:text-link-hover"
          >
            Enquire about this belt
          </a>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {added ? `${product.name} added to cart` : ''}
      </p>

      {site.shipping.freeTo.length > 0 && (
        <p className="mt-5 text-2xs uppercase tracking-[0.14em] text-subtle">
          Free shipping to {site.shipping.freeTo.join(', ')}
        </p>
      )}

      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
}
