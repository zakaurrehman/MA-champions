'use client';

import { useEffect } from 'react';
import { CloseIcon } from '@/components/ui/Icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * Size guide with a measurement diagram drawn as inline SVG.
 *
 * TODO: the strap lengths below are NOT confirmed by the client — the source
 * document gave no sizing. The diagram and how-to-measure copy are safe
 * (they describe method, not our product), but the length column must be
 * filled in before launch. It renders as "TBC" rather than a guessed number.
 */
/*
 * Strap length only. Plate thickness is a separate, PRICED choice made in the
 * Build selector — listing "Adult 2mm" here implied thickness was a size, and
 * put a second thickness control on the page that did not affect the price.
 */
const SIZES = [
  { name: 'Adult', length: null, note: 'Standard adult strap, any build' },
  { name: 'Kids', length: null, note: 'Scaled for children' },
  { name: 'Mini', length: null, note: 'Display / desk size, not wearable' },
] as const;

export default function SizeGuideModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close size guide"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        className="border-plate relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[--radius-plate] bg-surface p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="size-guide-title" className="text-2xl text-ink">
            Size guide
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center text-ink hover:text-link"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Measurement diagram */}
        <svg
          viewBox="0 0 400 130"
          className="mb-6 w-full"
          role="img"
          aria-label="Diagram of a championship belt showing total strap length measured end to end, and the centre plate width"
        >
          {/* Colours come from theme tokens so the diagram works in both themes. */}
          <rect
            x="30"
            y="52"
            width="340"
            height="26"
            rx="4"
            fill="var(--color-primary)"
            stroke="var(--color-line)"
          />
          <path
            d="M150 40h100a8 8 0 0 1 8 8v34a8 8 0 0 1-8 8H150a8 8 0 0 1-8-8V48a8 8 0 0 1 8-8Z"
            fill="var(--color-gold)"
            stroke="var(--color-gold-hi)"
          />
          <circle cx="52" cy="65" r="3" fill="var(--color-gold-hi)" />
          <circle cx="68" cy="65" r="3" fill="var(--color-gold-hi)" />
          <circle cx="332" cy="65" r="3" fill="var(--color-gold-hi)" />
          <circle cx="348" cy="65" r="3" fill="var(--color-gold-hi)" />

          {/* Total length dimension */}
          <line x1="30" y1="100" x2="370" y2="100" stroke="var(--color-subtle)" strokeWidth="1" />
          <line x1="30" y1="95" x2="30" y2="105" stroke="var(--color-subtle)" strokeWidth="1" />
          <line x1="370" y1="95" x2="370" y2="105" stroke="var(--color-subtle)" strokeWidth="1" />
          <text x="200" y="118" textAnchor="middle" fill="var(--color-muted)" fontSize="11">
            A — total strap length
          </text>

          {/* Plate width dimension */}
          <line x1="142" y1="28" x2="258" y2="28" stroke="var(--color-subtle)" strokeWidth="1" />
          <line x1="142" y1="23" x2="142" y2="33" stroke="var(--color-subtle)" strokeWidth="1" />
          <line x1="258" y1="23" x2="258" y2="33" stroke="var(--color-subtle)" strokeWidth="1" />
          <text x="200" y="18" textAnchor="middle" fill="var(--color-muted)" fontSize="11">
            B — centre plate width
          </text>
        </svg>

        <table className="w-full text-left text-sm">
          <caption className="sr-only">Belt sizes and strap lengths</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="pb-2 font-body text-2xs uppercase tracking-[0.16em] text-subtle">
                Size
              </th>
              <th scope="col" className="pb-2 font-body text-2xs uppercase tracking-[0.16em] text-subtle">
                Length (A)
              </th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map((s) => (
              <tr key={s.name} className="border-b border-line/60">
                <td className="py-3">
                  <span className="block font-semibold text-ink">{s.name}</span>
                  <span className="block text-2xs text-muted">{s.note}</span>
                </td>
                <td className="py-3 align-top text-muted">{s.length ?? 'TBC'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 border-t border-line pt-5">
          <h3 className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
            How to measure
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Measure around your waist where the belt will sit, over the clothing you will wear
            it with. A championship belt is worn loose over the hip, so add a few inches to a
            trouser waist measurement. If you are between sizes, tell us your measurement and
            we will set the snap positions to match.
          </p>
        </div>
      </div>
    </div>
  );
}
