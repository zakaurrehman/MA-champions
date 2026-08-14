'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Result {
  inserted: number;
  skipped: number;
  total: number;
  visible: number;
}

/**
 * Imports the JSON seed into the database.
 *
 * Shown only while the products table is empty. It is safe to press twice —
 * the endpoint skips slugs that already exist — but once the catalogue is in
 * the database the JSON file is no longer the source of truth, so the button
 * stops being offered.
 */
export default function SeedButton({ count }: { count: number }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const seed = async () => {
    setBusy(true);
    setError('');

    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as Result & { error?: string };

      if (res.ok) {
        setResult(data);
        router.refresh();
        return;
      }
      setError(data.error ?? 'Seed failed.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div role="status" className="mb-6 rounded-[--radius-plate] border border-line px-5 py-4">
        <p className="font-body text-sm font-semibold text-ink">Catalogue imported</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {result.inserted} belt{result.inserted === 1 ? '' : 's'} added
          {result.skipped > 0 && `, ${result.skipped} already present`}. The database now holds{' '}
          {result.total} products, {result.visible} visible in the shop.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-[--radius-plate] border border-line px-5 py-4">
      <p className="font-body text-sm font-semibold text-ink">Import your catalogue</p>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
        The database is connected but empty, so the shop is still being served from the JSON
        file and edits here cannot be saved. Import the {count} belts once and the admin panel
        becomes the source of truth.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={seed}
        disabled={busy}
        className="mt-4 rounded-[--radius-plate] bg-primary px-6 py-3 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
      >
        {busy ? 'Importing…' : `Import ${count} belts`}
      </button>
    </div>
  );
}
