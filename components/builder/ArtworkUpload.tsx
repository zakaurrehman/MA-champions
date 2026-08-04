'use client';

import { useRef, useState } from 'react';
import type { ArtworkMeta } from '@/lib/builder';

const ACCEPT = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
const MAX_BYTES = 8 * 1024 * 1024;

interface Props {
  artwork: ArtworkMeta | null;
  onChange: (artwork: ArtworkMeta | null) => void;
}

const prettySize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function ArtworkUpload({ artwork, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (file: File) => {
    setError(null);

    if (!ACCEPT.includes(file.type)) {
      setError('That file type is not supported. Use PNG, JPG, SVG or PDF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${prettySize(file.size)}. The limit is 8 MB.`);
      return;
    }

    // Object URLs keep large files out of React state and off the main thread.
    // PDFs get no preview — the belt preview only renders raster/vector images.
    const previewUrl = file.type === 'application/pdf' ? undefined : URL.createObjectURL(file);

    onChange({ name: file.name, type: file.type, size: file.size, previewUrl });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) accept(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-[--radius-plate] border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-primary bg-primary/5' : 'border-subtle/30'
        }`}
      >
        <p className="font-body text-sm font-semibold text-ink">
          Drag your artwork here
        </p>
        <p className="mt-1.5 text-2xs text-muted">PNG, JPG, SVG or PDF · up to 8 MB</p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 rounded-[--radius-plate] border border-subtle/40 px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-primary hover:text-link"
        >
          Choose a file
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          className="sr-only"
          aria-label="Upload your artwork"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) accept(file);
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      {artwork && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-[--radius-plate] border border-subtle/25 bg-surface px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-body text-sm font-semibold text-ink">{artwork.name}</p>
            <p className="text-2xs text-muted">
              {prettySize(artwork.size)}
              {artwork.type === 'application/pdf' && ' · PDF, no on-screen preview'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
          >
            Remove
          </button>
        </div>
      )}

      <p className="mt-4 text-2xs leading-relaxed text-muted">
        No artwork? Leave this blank — our team can draw the plates from a description, a
        photo or a rough sketch once you send the quote request.
      </p>
    </div>
  );
}
