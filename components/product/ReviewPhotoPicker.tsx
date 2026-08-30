'use client';

import { useState } from 'react';
import { prepareImageForUpload } from '@/lib/prepareImage';

export interface PendingPhoto {
  /** Local preview while it uploads, and after. */
  previewUrl: string;
  name: string;
  /** Set once the server has stored it. Only these are submitted. */
  url?: string;
  state: 'uploading' | 'done' | 'error';
  error?: string;
}

interface Props {
  photos: PendingPhoto[];
  onChange: (photos: PendingPhoto[]) => void;
  max?: number;
  disabled?: boolean;
}

const ACCEPT = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_BYTES = 6 * 1024 * 1024;

/**
 * Optional photo attachment for a review.
 *
 * Each file is uploaded as soon as it is chosen rather than on submit. Two
 * reasons: the customer sees a failure while they can still do something about
 * it, and a slow upload does not sit between them and the Submit button.
 *
 * The client-side type and size checks here are a courtesy — they give a fast,
 * specific error. The upload endpoint repeats all of them and additionally
 * verifies the file's magic bytes, because nothing that happens in this
 * component can be trusted by the server.
 */
export default function ReviewPhotoPicker({ photos, onChange, max = 5, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState('');

  const remaining = max - photos.length;

  const upload = async (file: File, previewUrl: string) => {
    const entry: PendingPhoto = { previewUrl, name: file.name, state: 'uploading' };
    let current = [...photos, entry];
    onChange(current);

    const settle = (patch: Partial<PendingPhoto>) => {
      current = current.map((p) => (p.previewUrl === previewUrl ? { ...p, ...patch } : p));
      onChange(current);
    };

    try {
      // Shrink before sending: a 6MB phone photo becomes a few hundred KB, so
      // the upload finishes on a phone connection instead of timing out.
      const prepared = await prepareImageForUpload(file);

      const form = new FormData();
      form.append('file', prepared);

      const res = await fetch('/api/reviews/photos', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

      if (res.ok && data.url) settle({ state: 'done', url: data.url });
      else settle({ state: 'error', error: data.error ?? 'Upload failed.' });
    } catch {
      settle({ state: 'error', error: 'Could not reach the server.' });
    }
  };

  const accept = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setNotice('');

    const chosen = Array.from(files).slice(0, Math.max(0, remaining));
    if (files.length > chosen.length) {
      setNotice(`You can add up to ${max} photos.`);
    }

    for (const file of chosen) {
      if (!ACCEPT.includes(file.type)) {
        setNotice('Photos must be JPG, PNG or WebP.');
        continue;
      }
      if (file.size > MAX_BYTES) {
        setNotice(`${file.name} is over 6MB.`);
        continue;
      }
      void upload(file, URL.createObjectURL(file));
    }
  };

  const remove = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    onChange(photos.filter((p) => p.previewUrl !== previewUrl));
  };

  return (
    <div>
      <span className="mb-2 block font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
        Upload product photos (optional)
      </span>

      <input
        id="rv-photos"
        type="file"
        accept={ACCEPT.join(',')}
        multiple
        disabled={disabled || remaining <= 0}
        className="sr-only"
        onChange={(e) => {
          accept(e.target.files);
          // Reset, so choosing the same file twice still fires a change.
          e.target.value = '';
        }}
      />

      {photos.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {photos.map((photo) => (
            <li key={photo.previewUrl} className="relative">
              <div
                className={`h-24 w-24 overflow-hidden rounded-[--radius-plate] border ${
                  photo.state === 'error' ? 'border-primary' : 'border-line'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob: URL */}
                <img
                  src={photo.previewUrl}
                  alt={photo.name}
                  className={`h-full w-full object-cover ${
                    photo.state === 'uploading' ? 'opacity-40' : ''
                  }`}
                />
              </div>

              {photo.state === 'uploading' && (
                <span
                  role="status"
                  className="absolute inset-0 grid place-items-center font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink"
                >
                  Uploading…
                </span>
              )}

              <button
                type="button"
                onClick={() => remove(photo.previewUrl)}
                aria-label={`Remove ${photo.name}`}
                className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-line bg-canvas font-body text-2xs text-ink hover:border-primary hover:text-link"
              >
                ×
              </button>

              {photo.state === 'error' && (
                <span className="mt-1 block w-24 text-2xs leading-tight text-link">
                  {photo.error}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <label
          htmlFor="rv-photos"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center rounded-[--radius-plate] border-2 border-dashed px-4 py-5 text-center transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-subtle/30 hover:border-primary'
          }`}
        >
          <span className="font-body text-sm font-semibold text-ink">
            Add a photo of your belt
          </span>
          <span className="mt-1 text-2xs text-muted">
            JPG, PNG or WebP · up to 6MB each · {remaining} of {max} remaining
          </span>
        </label>
      )}

      {notice && (
        <p role="alert" className="mt-2 text-2xs text-link">
          {notice}
        </p>
      )}

      <p className="mt-2 text-2xs leading-relaxed text-muted">
        Photos appear on the belt&rsquo;s page once your review is approved.
      </p>
    </div>
  );
}
