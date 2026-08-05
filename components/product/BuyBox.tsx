'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/products';
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
import { site, whatsAppHref } from '@/lib/site';
import VariantSelector from './VariantSelector';
import SizeGuideModal from './SizeGuideModal';
import { WhatsAppIcon } from '@/components/ui/Icons';

export default function BuyBox({ product }: { product: Product }) {
  const groups = getVariantGroups();
  const engravingCfg = getEngravingConfig();

  const [selection, setSelection] = useState(() => defaultSelection());
  const [engraving, setEngraving] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.openCart);
  const pushToast = useToasts((s) => s.push);

  const basePrice = product.salePrice ?? product.price;
  const unitPrice = useMemo(
    () => computePrice(basePrice, selection, engraving),
    [basePrice, selection, engraving]
  );
  const specLines = useMemo(
    () => describeSelection(selection, engraving),
    [selection, engraving]
  );

  const onSale = product.salePrice !== null && product.salePrice < product.price;
  const indicative = hasUnconfirmedModifiers();

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
      {/* Live price */}
      <div className="flex flex-wrap items-baseline gap-3">
        {onSale && (
          <span className="text-lg text-subtle line-through">
            {formatPrice(product.price, product.currency)}
          </span>
        )}
        <span
          aria-live="polite"
          className="font-display text-4xl text-plated"
        >
          {formatPrice(unitPrice, product.currency)}
        </span>
        {product.priceIncludesShipping && (
          <span className="font-body text-2xs uppercase tracking-[0.14em] text-subtle">
            Shipping included
          </span>
        )}
      </div>

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
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="h-11 w-14 border-x border-subtle/25 bg-transparent text-center font-body text-sm tabular-nums text-ink focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Increase quantity"
              className="grid h-11 w-11 place-items-center text-ink hover:text-link"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className="bg-primary plate-sheen w-full rounded-[--radius-plate] px-7 py-4 font-display text-base uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover"
        >
          {added ? 'Added to cart' : 'Add to cart'}
        </button>

        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
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
