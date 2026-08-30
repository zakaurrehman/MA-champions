'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import OrderDetail, { type OrderView } from './OrderDetail';

interface Props {
  reference: string;
  token: string | null;
}

type State = 'loading' | 'ready' | 'error';

/**
 * The page a customer lands on straight after paying.
 *
 * It fetches the order rather than being handed it in the URL, because
 * anything in the URL was written by the browser and could say whatever the
 * customer liked. The reference and the signed token go to the server, and the
 * server decides what this page is allowed to show.
 *
 * If the token is missing or expired the order still resolves — as the public
 * summary — and the page points at the lookup form for the full version. A
 * customer returning to a bookmarked confirmation weeks later should not hit a
 * dead end.
 */
export default function OrderConfirmation({ reference, token }: Props) {
  const [state, setState] = useState<State>('loading');
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, token }),
        });
        const data = (await res.json().catch(() => ({}))) as OrderView & { error?: string };

        if (cancelled) return;

        if (res.ok) {
          setOrder(data);
          setState('ready');
        } else {
          setError(data.error ?? 'We could not load that order.');
          setState('error');
        }
      } catch {
        if (cancelled) return;
        setError('Could not reach the server.');
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, token]);

  if (state === 'loading') {
    return (
      <div aria-busy="true" aria-live="polite" className="max-w-2xl">
        <div className="rounded-[--radius-plate] border border-line p-8">
          <p className="font-body text-sm text-muted">Loading your order…</p>
          <div className="mt-5 flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-4 w-full animate-pulse rounded bg-subtle/15" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error' || !order) {
    return (
      <div role="alert" className="max-w-2xl rounded-[--radius-plate] border border-line p-6">
        <p className="font-display text-2xl text-ink">We could not load that order</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{error}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Your payment is not affected by this. If you have your reference, look it up on the{' '}
          <Link href="/track-order" className="text-link hover:underline">
            track order page
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 rounded-[--radius-plate] border border-primary/50 p-5">
        <p className="font-display text-2xl text-ink">Thank you — we have your order</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Save your reference{' '}
          <strong className="text-ink">{order.reference}</strong>. You can come back at any time
          and look it up with your email or phone — no account needed.
        </p>
      </div>

      <OrderDetail order={order} />

      {!order.detailed && (
        <p className="mt-4 text-2xs leading-relaxed text-muted">
          This link no longer proves who you are, so prices and contact details are hidden. Enter
          your reference with the email or phone you used on the{' '}
          <Link href="/track-order" className="text-link hover:underline">
            track order page
          </Link>{' '}
          to see the full order.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/collections"
          className="rounded-[--radius-plate] bg-primary px-6 py-3 font-display text-sm uppercase tracking-wide text-on-primary hover:bg-primary-hover"
        >
          Keep browsing
        </Link>
        <Link
          href="/account"
          className="rounded-[--radius-plate] border border-subtle/40 px-6 py-3 font-display text-sm uppercase tracking-wide text-ink hover:border-primary hover:text-link"
        >
          Create an account to save it
        </Link>
      </div>
    </div>
  );
}
