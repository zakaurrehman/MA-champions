'use client';

import { useCallback, useEffect, useRef } from 'react';

interface Props {
  photos: string[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  /** Describes the set, e.g. "Photo from Sarah's review". */
  label: string;
}

/**
 * Full-screen photo viewer.
 *
 * Built as a real dialog rather than a styled div: it takes focus on open,
 * returns it to whatever opened it on close, and traps Tab inside itself.
 * Without that, a keyboard user tabs straight out of the overlay into the page
 * behind it and cannot get back — the picture is on screen but they are not
 * in it.
 */
export default function Lightbox({ photos, index, onClose, onNavigate, label }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<Element | null>(null);

  const count = photos.length;
  const go = useCallback(
    (delta: number) => onNavigate((index + delta + count) % count),
    [index, count, onNavigate]
  );

  useEffect(() => {
    returnFocusTo.current = document.activeElement;
    closeRef.current?.focus();

    // The page behind must not scroll under the overlay.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && count > 1) go(1);
      else if (e.key === 'ArrowLeft' && count > 1) go(-1);
      else if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      (returnFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose, go, count]);

  const current = photos[index];
  if (!current) return null;

  const arrow =
    'grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/40 text-white transition-colors hover:bg-black/70';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 p-4 backdrop-blur-sm"
      onClick={(e) => {
        // Only the backdrop closes — clicks on the photo itself must not.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-4">
        <span className="font-body text-2xs uppercase tracking-[0.16em] text-white/70">
          {count > 1 ? `${index + 1} of ${count}` : label}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="rounded-[--radius-plate] border border-white/25 px-4 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white/10"
        >
          Close
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-3 py-4">
        {count > 1 && (
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={arrow}>
            ‹
          </button>
        )}

        {/*
          A plain img, not next/image: optimisation is off site-wide (see
          next.config.ts) and this overlay is user-triggered, so lazy loading
          and layout reservation buy nothing. object-contain keeps the photo's
          real aspect ratio, which is the whole point of opening it full size.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={`${label} — ${index + 1} of ${count}`}
          className="max-h-full max-w-full rounded-[--radius-plate] object-contain"
        />

        {count > 1 && (
          <button type="button" onClick={() => go(1)} aria-label="Next photo" className={arrow}>
            ›
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="flex shrink-0 justify-center gap-2 overflow-x-auto py-1">
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => onNavigate(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-[--radius-plate] border-2 transition-colors ${
                i === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
