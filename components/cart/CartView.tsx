'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart, selectSubtotal } from '@/lib/cart';
import { formatPrice } from '@/lib/products';
import { useHydrated } from '@/lib/useHydrated';
import { site, whatsAppHref } from '@/lib/site';
import EmptyState from '@/components/ui/EmptyState';
import { WhatsAppIcon } from '@/components/ui/Icons';

export default function CartView() {
  const items = useCart((s) => s.items);
  const notes = useCart((s) => s.notes);
  const setNotes = useCart((s) => s.setNotes);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const subtotal = useCart(selectSubtotal);
  const hydrated = useHydrated();

  if (!hydrated) {
    return <div className="h-64" aria-busy="true" aria-label="Loading your cart" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        body="Nothing here yet. Spec exactly what you want in the Belt Builder, or browse the collections."
        ctaLabel="Build your belt"
        ctaHref="/build"
      />
    );
  }

  const message = [
    'Hi, I would like to order:',
    '',
    ...items.map(
      (i) =>
        `${i.quantity} × ${i.name}\n  ${i.specLines.join('\n  ')}\n  ${formatPrice(
          i.unitPrice * i.quantity,
          i.currency
        )}`
    ),
    '',
    `Subtotal: ${formatPrice(subtotal)}`,
    notes.trim() ? `\nNotes: ${notes.trim()}` : '',
  ].join('\n');

  const wa = whatsAppHref(message);

  return (
    <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
      <ul>
        {items.map((item) => (
          <li key={item.key} className="flex gap-5 border-b border-line py-6 first:pt-0">
            {item.image && (
              <Link
                href={`/products/${item.slug}`}
                className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[--radius-plate] bg-surface"
              >
                <Image src={item.image} alt={item.imageAlt} fill sizes="112px" className="object-cover" />
              </Link>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-body text-base font-semibold text-ink hover:text-link"
                >
                  {item.name}
                </Link>
                <span className="shrink-0 font-body text-base font-semibold tabular-nums text-ink">
                  {formatPrice(item.unitPrice * item.quantity, item.currency)}
                </span>
              </div>

              <ul className="mt-1.5 text-2xs leading-relaxed text-muted">
                {item.specLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>

              <div className="mt-4 flex items-center gap-5">
                <div className="inline-flex items-center rounded-[--radius-plate] border border-subtle/25">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.key, item.quantity - 1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                    className="grid h-9 w-9 place-items-center text-ink hover:text-link"
                  >
                    −
                  </button>
                  <span className="w-9 text-center font-body text-sm tabular-nums text-ink">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.key, item.quantity + 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="grid h-9 w-9 place-items-center text-ink hover:text-link"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="text-2xs uppercase tracking-[0.14em] text-subtle hover:text-link"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-plate rounded-[--radius-plate] bg-surface p-6">
          <h2 className="font-display text-lg uppercase tracking-wide text-ink">Summary</h2>

          <label htmlFor="cart-page-notes" className="mb-2 mt-6 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Order notes
          </label>
          <textarea
            id="cart-page-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Deadline, engraving details, anything else…"
            className="w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-3 py-2.5 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none"
          />

          <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
            <span className="font-body text-2xs uppercase tracking-[0.18em] text-subtle">
              Subtotal
            </span>
            <span className="font-display text-3xl text-plated">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-2 text-2xs leading-relaxed text-muted">
            {/* No payment integration in v1 — say so rather than implying checkout. */}
            Shipping and your final price are confirmed on a written quote. Nothing is charged
            through this website.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary hover:bg-primary-hover"
              >
                <WhatsAppIcon className="h-5 w-5" />
                Checkout on WhatsApp
              </a>
            ) : (
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary hover:bg-primary-hover"
              >
                Request a quote
              </Link>
            )}
          </div>

          {site.shipping.freeTo.length > 0 && (
            <p className="mt-4 text-center text-2xs uppercase tracking-[0.14em] text-subtle">
              Free shipping to {site.shipping.freeTo.join(', ')}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
