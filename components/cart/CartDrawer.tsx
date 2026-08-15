'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart, selectSubtotal, selectCount } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { site, whatsAppHref } from '@/lib/site';
import { useHydrated } from '@/lib/useHydrated';
import { recordOrder } from '@/lib/recordOrder';
import { CloseIcon, WhatsAppIcon } from '@/components/ui/Icons';

export default function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.closeCart);
  const items = useCart((s) => s.items);
  const notes = useCart((s) => s.notes);
  const setNotes = useCart((s) => s.setNotes);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const subtotal = useCart(selectSubtotal);
  const count = useCart(selectCount);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  if (!isOpen || !hydrated) return null;

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

  /* Shown under the buttons so people know card and crypto exist before they
     commit to the WhatsApp route. */
  const payMethods = [
    site.paypalManual.email ? 'PayPal' : null,
    site.cryptoWallets.length > 0 ? 'Crypto' : null,
    wa ? 'WhatsApp' : null,
  ].filter(Boolean) as string[];

  /*
   * Log the intent before the tab leaves for WhatsApp. We cannot read the
   * conversation afterwards, so without this an order only exists if the
   * customer actually sends the message. Never blocks the handoff.
   */
  const logIntent = () => {
    void recordOrder({
      kind: 'cart',
      channel: wa ? 'whatsapp' : 'copy',
      note: notes,
      items: items.map((i) => ({
        slug: i.slug,
        variantId: typeof i.selection.variant === 'string' ? i.selection.variant : null,
        quantity: i.quantity,
        specLines: i.specLines,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-[75]">
      <button
        type="button"
        aria-label="Close cart"
        onClick={close}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="absolute right-0 top-0 flex h-full w-[min(28rem,92vw)] flex-col border-l border-line bg-canvas"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-base uppercase tracking-wide text-ink">
            Cart {count > 0 && <span className="text-subtle">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="grid h-10 w-10 place-items-center text-ink hover:text-link"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="text-base text-muted">Your cart is empty.</p>
            <Link
              href="/build"
              onClick={close}
              className="rounded-[--radius-plate] bg-primary px-6 py-3 font-display text-sm uppercase tracking-wide text-on-primary hover:bg-primary-hover"
            >
              Build your belt
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5 py-4">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 border-b border-line py-4 last:border-0">
                  {item.image && (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[--radius-plate] bg-surface">
                      <Image src={item.image} alt={item.imageAlt} fill sizes="80px" className="object-cover" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={close}
                      className="font-body text-sm font-semibold text-ink hover:text-link"
                    >
                      {item.name}
                    </Link>
                    <ul className="mt-1 text-2xs leading-snug text-muted">
                      {item.specLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>

                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-[--radius-plate] border border-subtle/25">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.key, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="grid h-8 w-8 place-items-center text-ink hover:text-link"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-body text-xs tabular-nums text-ink">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="grid h-8 w-8 place-items-center text-ink hover:text-link"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-body text-sm font-semibold tabular-nums text-ink">
                        {formatPrice(item.unitPrice * item.quantity, item.currency)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="mt-2 text-2xs uppercase tracking-[0.14em] text-subtle hover:text-link"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="shrink-0 border-t border-line px-5 py-5">
              <label htmlFor="cart-notes" className="mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
                Order notes
              </label>
              <textarea
                id="cart-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Deadline, engraving details, anything else…"
                className="w-full rounded-[--radius-plate] border border-subtle/25 bg-surface px-3 py-2 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none"
              />

              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-body text-2xs uppercase tracking-[0.18em] text-subtle">
                  Subtotal
                </span>
                <span className="font-display text-2xl text-plated">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-2xs text-muted">
                {payMethods.length > 1
                  ? `Free shipping to ${site.shipping.freeTo.join(', ')}.`
                  : 'Shipping and final price confirmed on your quote.'}
              </p>

              {/*
                Checkout leads, not WhatsApp. PayPal and crypto need a form
                that does not belong in a 28rem drawer, so the drawer's job is
                to summarise and hand off to /cart where every method lives.
                Previously WhatsApp was the only visible way to pay from here.
              */}
              <div className="mt-4 flex flex-col gap-2.5">
                <Link
                  href="/cart"
                  onClick={close}
                  className="inline-flex w-full items-center justify-center rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary hover:bg-primary-hover"
                >
                  Checkout
                </Link>

                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={logIntent}
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-[--radius-plate] border border-subtle/40 px-6 py-3.5 font-display text-sm uppercase tracking-wide text-ink hover:border-primary hover:text-link"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    Order on WhatsApp
                  </a>
                ) : (
                  <Link
                    href="/contact"
                    onClick={close}
                    className="inline-flex w-full items-center justify-center rounded-[--radius-plate] border border-subtle/40 px-6 py-3.5 font-display text-sm uppercase tracking-wide text-ink hover:border-primary hover:text-link"
                  >
                    Request a quote
                  </Link>
                )}
              </div>

              {payMethods.length > 0 && (
                <p className="mt-3 text-center text-2xs uppercase tracking-[0.14em] text-subtle">
                  {payMethods.join(' · ')}
                </p>
              )}

            </footer>
          </>
        )}
      </div>
    </div>
  );
}
