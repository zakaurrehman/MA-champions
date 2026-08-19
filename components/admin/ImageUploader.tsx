'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { prepareImageForUpload } from '@/lib/prepareImage';

export interface EditableImage {
  src: string;
  alt: string;
}

interface Props {
  slug: string;
  images: EditableImage[];
  onChange: (images: EditableImage[]) => void;
}

/**
 * Product image manager: upload, reorder, describe, remove.
 *
 * Reordering uses buttons rather than drag-and-drop deliberately — drag is
 * fiddly on a phone and unusable by keyboard, and this panel gets used from a
 * phone in a workshop.
 */
export default function ImageUploader({ slug, images, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList) => {
    setBusy(true);
    setError('');

    const added: EditableImage[] = [];

    for (const original of Array.from(files)) {
      /*
       * Shrink to web size here rather than uploading a 6MB phone photo and
       * asking Vercel to resize it on every request. That resizing is metered,
       * and running out of it returns 402 for every image on the site — which
       * is exactly what happened.
       */
      const file = await prepareImageForUpload(original);

      const form = new FormData();
      form.append('file', file);
      form.append('slug', slug || 'belt');

      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
        const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

        if (!res.ok || !data.url) {
          setError(data.error ?? `Could not upload ${original.name}.`);
          continue;
        }
        // Alt text starts empty on purpose: the save endpoint rejects blanks,
        // which forces a real description instead of a copied filename.
        added.push({ src: data.url, alt: '' });
      } catch {
        setError('Upload failed. Check your connection.');
      }
    }

    if (added.length > 0) onChange([...images, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const move = (index: number, delta: number) => {
    const next = [...images];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  const setAlt = (index: number, alt: string) => {
    const next = [...images];
    next[index] = { ...next[index]!, alt };
    onChange(next);
  };

  const remove = (index: number) => onChange(images.filter((_, i) => i !== index));

  const missingAlt = images.filter((i) => i.alt.trim().length < 3).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Images ({images.length})
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-[--radius-plate] border border-subtle/40 px-4 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-primary hover:text-link disabled:opacity-40"
        >
          {busy ? 'Uploading…' : 'Add images'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        aria-label="Upload product images"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      {missingAlt > 0 && (
        <p className="mt-3 rounded-[--radius-plate] border border-line px-4 py-3 text-2xs leading-relaxed text-muted">
          {missingAlt} image{missingAlt > 1 ? 's' : ''} still need alt text. Describe what the
          photo shows — it is what screen readers announce and what image search reads. Saving
          is blocked until every image has one.
        </p>
      )}

      {images.length === 0 ? (
        <p className="mt-4 rounded-[--radius-plate] border border-dashed border-subtle/30 px-4 py-8 text-center text-sm text-muted">
          No images yet. The first one becomes the main photo.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {images.map((image, index) => (
            <li
              key={image.src}
              className="flex flex-wrap items-start gap-4 rounded-[--radius-plate] border border-line p-3 sm:flex-nowrap"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[--radius-plate] bg-surface">
                <Image src={image.src} alt="" fill sizes="96px" className="object-cover" />
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-primary py-0.5 text-center font-body text-2xs font-bold uppercase text-on-primary">
                    Main
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <label
                  htmlFor={`alt-${index}`}
                  className="mb-1.5 block font-body text-2xs font-semibold uppercase tracking-[0.16em] text-subtle"
                >
                  Alt text
                </label>
                <input
                  id={`alt-${index}`}
                  type="text"
                  value={image.alt}
                  maxLength={200}
                  onChange={(e) => setAlt(index, e.target.value)}
                  placeholder="e.g. Winged Eagle belt laid flat, gold centre plate on black leather"
                  className={`w-full rounded-[--radius-plate] border bg-canvas px-3 py-2 font-body text-sm text-ink placeholder:text-subtle/60 focus:outline-none ${
                    image.alt.trim().length < 3
                      ? 'border-primary/60 focus:border-primary'
                      : 'border-subtle/25 focus:border-primary'
                  }`}
                />

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded-[--radius-plate] border border-subtle/30 px-3 py-1.5 font-body text-2xs uppercase tracking-[0.14em] text-muted hover:text-ink disabled:opacity-30"
                  >
                    ↑ Up
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    className="rounded-[--radius-plate] border border-subtle/30 px-3 py-1.5 font-body text-2xs uppercase tracking-[0.14em] text-muted hover:text-ink disabled:opacity-30"
                  >
                    ↓ Down
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-[--radius-plate] border border-subtle/30 px-3 py-1.5 font-body text-2xs uppercase tracking-[0.14em] text-subtle hover:border-primary hover:text-link"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
