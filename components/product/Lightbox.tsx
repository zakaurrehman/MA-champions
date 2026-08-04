'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/lib/types';
import { CloseIcon } from '@/components/ui/Icons';

interface Props {
  images: ProductImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

/**
 * Full-screen image inspection. Arrow keys and Escape work; the belt fills as
 * much of the viewport as it can, because the etching detail is the sell.
 */
export default function Lightbox({ images, index, onClose, onIndexChange }: Props) {
  const go = useCallback(
    (delta: number) => onIndexChange((index + delta + images.length) % images.length),
    [index, images.length, onIndexChange]
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, go]);

  const current = images[index];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image ${index + 1} of ${images.length}`}
      className="fixed inset-0 z-[80] flex flex-col bg-black/95"
    >
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <span className="font-body text-xs uppercase tracking-[0.16em] text-subtle">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close image viewer"
          className="grid h-10 w-10 place-items-center text-ink hover:text-link"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex-1">
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          sizes="100vw"
          className="object-contain p-3"
          placeholder={current.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={current.blurDataURL}
        />
      </div>

      {images.length > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-3 p-4">
          <button
            type="button"
            onClick={() => go(-1)}
            className="border-plate rounded-[--radius-plate] px-5 py-2.5 font-body text-xs uppercase tracking-[0.14em] text-ink hover:border-primary hover:text-link"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="border-plate rounded-[--radius-plate] px-5 py-2.5 font-body text-xs uppercase tracking-[0.14em] text-ink hover:border-primary hover:text-link"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
