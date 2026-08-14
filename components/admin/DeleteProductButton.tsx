'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Two-step delete. The first click arms it, the second confirms — a single
 * click next to "Edit" is far too easy to hit by accident, and this is
 * destructive with no undo.
 */
export default function DeleteProductButton({ slug, name }: { slug: string; name: string }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
      setArmed(false);
    }
  };

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={`Delete ${name}`}
        className="rounded-[--radius-plate] border border-subtle/30 px-4 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle transition-colors hover:border-primary hover:text-link"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-[--radius-plate] bg-primary px-4 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-on-primary disabled:opacity-40"
      >
        {busy ? 'Deleting…' : 'Confirm'}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="px-2 font-body text-2xs uppercase tracking-[0.14em] text-subtle hover:text-ink"
      >
        No
      </button>
    </span>
  );
}
