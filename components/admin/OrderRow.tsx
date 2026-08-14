'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';

export interface AdminOrder {
  id: number;
  reference: string;
  kind: 'cart' | 'product' | 'build';
  channel: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerNote: string | null;
  items: {
    slug: string;
    name: string;
    variantName: string | null;
    quantity: number;
    unitPrice: number | null;
    total: number | null;
    specLines: string[];
  }[];
  buildSpec: Record<string, unknown> | null;
  subtotal: number;
  currency: string;
  createdAt: string;
}

/** Ordered as the job actually progresses, so the next step is always obvious. */
export const STATUSES = [
  'new',
  'quoted',
  'paid',
  'production',
  'shipped',
  'completed',
  'cancelled',
] as const;

const KIND_LABEL: Record<AdminOrder['kind'], string> = {
  cart: 'Cart',
  product: 'Single belt',
  build: 'Custom build',
};

export default function OrderRow({ order }: { order: AdminOrder }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const setStatus = async (status: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const describedAs = Array.isArray(order.buildSpec?.describedAs)
    ? (order.buildSpec.describedAs as [string, string][])
    : null;

  return (
    <li className="rounded-[--radius-plate] border border-line p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg text-ink">{order.reference}</p>
          <p className="mt-0.5 text-2xs uppercase tracking-[0.14em] text-subtle">
            {KIND_LABEL[order.kind]} · {order.channel} ·{' '}
            <time dateTime={order.createdAt}>
              {new Date(order.createdAt).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
          </p>
        </div>

        <p className="font-display text-2xl text-plated">
          {formatPrice(order.subtotal, order.currency)}
        </p>
      </div>

      {(order.customerName || order.customerEmail) && (
        <p className="mt-3 font-body text-sm text-ink">
          {order.customerName}
          {order.customerEmail && (
            <>
              {order.customerName && ' · '}
              <a href={`mailto:${order.customerEmail}`} className="text-link hover:underline">
                {order.customerEmail}
              </a>
            </>
          )}
        </p>
      )}

      {/* Lines */}
      {order.items.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {order.items.map((item, i) => (
            <li key={`${item.slug}-${i}`} className="text-sm text-muted">
              <span className="text-ink">{item.quantity} ×</span>{' '}
              <Link href={`/products/${item.slug}`} className="hover:text-link">
                {item.name}
              </Link>
              {item.variantName && ` — ${item.variantName}`}
              {item.total !== null && ` — ${formatPrice(item.total, order.currency)}`}
              {item.specLines.length > 0 && (
                <span className="block pl-5 text-2xs text-subtle">
                  {item.specLines.join(' · ')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Full build spec */}
      {describedAs && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
          >
            {open ? 'Hide' : 'Show'} build spec
          </button>
          {open && (
            <dl className="mt-3 grid gap-x-6 sm:grid-cols-2">
              {describedAs.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line py-1.5">
                  <dt className="text-2xs uppercase tracking-[0.14em] text-subtle">{k}</dt>
                  <dd className="text-right font-body text-sm text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {order.customerNote && (
        <p className="mt-3 whitespace-pre-wrap rounded-[--radius-plate] border border-line px-4 py-3 text-sm leading-relaxed text-muted">
          {order.customerNote}
        </p>
      )}

      {/* Status */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy || s === order.status}
            onClick={() => setStatus(s)}
            className={`rounded-[--radius-plate] border px-3 py-1.5 font-body text-2xs font-semibold uppercase tracking-[0.14em] transition-colors disabled:cursor-default ${
              s === order.status
                ? 'border-primary bg-primary text-on-primary'
                : 'border-subtle/30 text-muted hover:border-primary hover:text-link disabled:opacity-40'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </li>
  );
}
