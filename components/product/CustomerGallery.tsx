'use client';

import { useState } from 'react';
import Lightbox from '@/components/ui/Lightbox';

interface Props {
  /** Flattened photos across every approved review for this belt. */
  photos: { url: string; author: string }[];
}

const MAX_SHOWN = 10;

/**
 * "Photos from customers" — every approved review photo for one belt, above
 * the reviews themselves.
 *
 * Kept visually distinct from the product gallery at the top of the page, and
 * captioned as customer photos, because the entire value of this section is
 * that a shopper can tell the difference between our studio shots and what the
 * belt actually looks like on someone's shelf. Blurring that line would be
 * both dishonest and self-defeating.
 */
export default function CustomerGallery({ photos }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (photos.length === 0) return null;

  const shown = expanded ? photos : photos.slice(0, MAX_SHOWN);
  const hidden = photos.length - shown.length;

  return (
    <section aria-labelledby="customer-photos-h" className="mb-8 border-b border-line pb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="customer-photos-h" className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
          Photos from customers
        </h3>
        <span className="font-body text-2xs uppercase tracking-[0.14em] text-subtle">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'} · not studio shots
        </span>
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {shown.map((photo, i) => (
          <li key={photo.url}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open customer photo ${i + 1} of ${photos.length}, from ${photo.author}`}
              className="block aspect-square w-full overflow-hidden rounded-[--radius-plate] border border-line transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- see Lightbox */}
              <img
                src={photo.url}
                alt={`Photo of this belt taken by ${photo.author}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:underline"
        >
          Show {hidden} more
        </button>
      )}

      {open !== null && (
        <Lightbox
          photos={shown.map((p) => p.url)}
          index={open}
          onClose={() => setOpen(null)}
          onNavigate={setOpen}
          label={`Customer photo from ${shown[open]?.author ?? 'a review'}`}
        />
      )}
    </section>
  );
}
