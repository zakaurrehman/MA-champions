'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/lib/types';
import Lightbox from './Lightbox';

interface Props {
  images: ProductImage[];
  productName: string;
}

/**
 * Product gallery with hover magnification and a full-screen lightbox.
 *
 * Deliberately the most capable component on the site: buyers judge a belt on
 * etching depth, and they cannot do that at 600px. Hover pans a 2.2× zoom;
 * click opens the full-resolution view.
 */
export default function ProductGallery({ images, productName }: Props) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null);

  const current = images[active];
  if (!current) return null;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main frame */}
      <div
        ref={frameRef}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={onMove}
        className="border-plate relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-[--radius-plate] bg-surface"
      >
        <Image
          src={current.src}
          alt={current.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          placeholder={current.blurDataURL ? 'blur' : 'empty'}
          blurDataURL={current.blurDataURL}
          className="object-cover transition-transform duration-200 ease-out"
          style={{
            transform: zooming ? 'scale(2.2)' : 'scale(1)',
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
        />

        {/* Click target sits above the image so zoom state is not disturbed. */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 h-full w-full cursor-zoom-in"
          aria-label={`Open full-screen view of ${productName}`}
        />

        <span className="pointer-events-none absolute bottom-3 right-3 rounded-[--radius-plate] bg-canvas/80 px-2.5 py-1 font-body text-2xs uppercase tracking-[0.14em] text-muted backdrop-blur-sm">
          Hover to zoom · click to expand
        </span>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <ul className="rail flex gap-2.5 sm:grid sm:grid-cols-5 lg:grid-cols-6">
          {images.map((img, i) => (
            <li key={img.src} className="w-20 shrink-0 sm:w-auto">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={`relative block aspect-square w-full overflow-hidden rounded-[--radius-plate] border transition-colors ${
                  i === active
                    ? 'border-primary'
                    : 'border-subtle/20 hover:border-subtle/50'
                }`}
              >
                <Image
                  src={img.src}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="88px"
                  placeholder={img.blurDataURL ? 'blur' : 'empty'}
                  blurDataURL={img.blurDataURL}
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {lightboxOpen && (
        <Lightbox
          images={images}
          index={active}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setActive}
        />
      )}
    </div>
  );
}
