'use client';

import { useEffect, useState, type RefObject } from 'react';

interface Props {
  /** The real Add to cart area. The bar shows whenever it is off screen. */
  targetRef: RefObject<HTMLElement | null>;
  buildName: string | null;
  price: string;
  soldOut: boolean;
  added: boolean;
  onAdd: () => void;
}

/**
 * A pinned Add to cart bar for phones and small tablets.
 *
 * On a phone the real button sits below the gallery, the build picker, strap
 * size, six leather colours, engraving and quantity — well over a screen down.
 * Someone who has already decided should not have to scroll to buy.
 *
 * It hides itself while the real button is on screen, so there are never two
 * Add to cart buttons in view at once, and it is never shown from `lg` up,
 * where the buy box sits beside the gallery and is always visible.
 *
 * While visible it marks <body data-buy-bar>, which globals.css uses to lift
 * the WhatsApp button and the toast stack above it rather than underneath.
 */
export default function StickyBuyBar({
  targetRef,
  buildName,
  price,
  soldOut,
  added,
  onAdd,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => setVisible(!entry!.isIntersecting), {
      threshold: 0,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetRef]);

  useEffect(() => {
    if (visible) document.body.dataset.buyBar = 'true';
    else delete document.body.dataset.buyBar;
    return () => {
      delete document.body.dataset.buyBar;
    };
  }, [visible]);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-surface/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-200 motion-reduce:transition-none lg:hidden ${
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center gap-4">
        <div className="min-w-0 flex-1">
          {buildName && <p className="truncate text-xs text-muted">{buildName}</p>}
          <p className="font-display text-xl leading-tight text-plated">{price}</p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={soldOut}
          // Taken out of the tab order while hidden, so a keyboard user never
          // lands on an invisible button.
          tabIndex={visible ? 0 : -1}
          className="shrink-0 rounded-[--radius-plate] bg-primary px-6 py-3.5 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
        >
          {soldOut ? 'Sold out' : added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
