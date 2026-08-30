'use client';

import { useState } from 'react';
import Lightbox from '@/components/ui/Lightbox';

interface Props {
  photos: string[];
  /** Whose photos these are, for the alt text and the dialog label. */
  authorName: string;
  size?: 'sm' | 'md';
}

/**
 * The photo strip under a single review.
 *
 * Deliberately plain squares rather than a masonry layout: customer photos
 * arrive at every aspect ratio and orientation, and a uniform grid is the only
 * thing that stops a row of phone snaps looking like a broken page. The full
 * frame is one tap away in the lightbox.
 */
export default function ReviewPhotos({ photos, authorName, size = 'sm' }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const box = size === 'sm' ? 'h-20 w-20 sm:h-24 sm:w-24' : 'h-28 w-28 sm:h-32 sm:w-32';

  return (
    <>
      <ul className="mt-3 flex flex-wrap gap-2">
        {photos.map((photo, i) => (
          <li key={photo}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open photo ${i + 1} of ${photos.length} from ${authorName}'s review`}
              className={`${box} block overflow-hidden rounded-[--radius-plate] border border-line transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-[--color-primary]`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- see Lightbox */}
              <img
                src={photo}
                alt={`Customer photo ${i + 1} from ${authorName}'s review`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <Lightbox
          photos={photos}
          index={open}
          onClose={() => setOpen(null)}
          onNavigate={setOpen}
          label={`Photo from ${authorName}'s review`}
        />
      )}
    </>
  );
}
