'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StarRating from '@/components/ui/StarRating';

export interface AdminReview {
  id: number;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  createdAt: string;
}

const STATUS_STYLES: Record<AdminReview['status'], string> = {
  pending: 'border-subtle/40 text-muted',
  approved: 'border-primary text-link',
  rejected: 'border-subtle/30 text-subtle',
};

export default function ReviewRow({ review }: { review: AdminReview }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const act = async (action: 'approve' | 'reject' | 'unpublish', verified?: boolean) => {
    setBusy(action);
    setError('');

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id, action, verified }),
      });

      if (res.ok) {
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? 'Update failed.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(null);
    }
  };

  const btn =
    'rounded-[--radius-plate] px-4 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] transition-colors disabled:opacity-40';

  return (
    <li className="rounded-[--radius-plate] border border-line p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <StarRating rating={review.rating} size="md" />
          {review.title && (
            <p className="mt-2 font-body text-sm font-semibold text-ink">{review.title}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-[--radius-plate] border px-2.5 py-1 font-body text-2xs font-semibold uppercase tracking-[0.14em] ${STATUS_STYLES[review.status]}`}
        >
          {review.status}
          {review.verified && ' · verified'}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{review.body}</p>

      <p className="mt-3 text-2xs uppercase tracking-[0.14em] text-subtle">
        {review.authorName} ·{' '}
        <Link href={`/products/${review.productSlug}`} className="hover:text-link">
          {review.productSlug}
        </Link>{' '}
        ·{' '}
        <time dateTime={review.createdAt}>
          {new Date(review.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-link">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {review.status !== 'approved' && (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => act('approve')}
              className={`${btn} bg-primary text-on-primary hover:bg-primary-hover`}
            >
              {busy === 'approve' ? 'Publishing…' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => act('approve', true)}
              className={`${btn} border border-subtle/40 text-ink hover:border-primary hover:text-link`}
            >
              Approve as verified buyer
            </button>
          </>
        )}

        {review.status === 'approved' && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => act('unpublish')}
            className={`${btn} border border-subtle/40 text-ink hover:border-primary hover:text-link`}
          >
            {busy === 'unpublish' ? 'Unpublishing…' : 'Unpublish'}
          </button>
        )}

        {review.status !== 'rejected' && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => act('reject')}
            className={`${btn} border border-subtle/30 text-subtle hover:border-subtle/60 hover:text-ink`}
          >
            {busy === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
        )}
      </div>
    </li>
  );
}
