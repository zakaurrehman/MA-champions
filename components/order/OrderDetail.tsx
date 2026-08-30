'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { site, whatsAppHref } from '@/lib/site';
import { WhatsAppIcon } from '@/components/ui/Icons';

export interface OrderItemView {
  name: string;
  quantity: number;
  variantName: string | null;
  unitPrice: number | null;
  total: number | null;
}

export interface OrderView {
  reference: string;
  stage: string;
  detail: string;
  step: number;
  totalSteps: number;
  placedAt: string;
  updatedAt: string;
  items: OrderItemView[];
  tracking: { carrier: string | null; number: string } | null;
  /** Present only when the viewer proved they are entitled to the full order. */
  detailed?: boolean;
  subtotal?: number;
  currency?: string;
  payment?: { label: string; settled: boolean };
  note?: string | null;
  customer?: { name: string | null; email: string | null; phone: string | null };
}

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * One order, rendered the same way wherever it appears.
 *
 * Shared by the post-payment confirmation page and the guest lookup so the two
 * cannot drift into showing different things about the same order. The
 * `detailed` flag is set by the server, never by the page: a component prop
 * must not be what decides whether prices are visible.
 */
export default function OrderDetail({ order }: { order: OrderView }) {
  const currency = order.currency ?? 'USD';
  const wa = whatsAppHref(`Hi, I have a question about my order ${order.reference}.`);

  return (
    <div className="rounded-[--radius-plate] border border-line p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-body text-2xs uppercase tracking-[0.16em] text-subtle">
            Order {order.reference}
          </p>
          <p className="mt-1 font-display text-3xl text-ink">{order.stage}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{order.detail}</p>
        </div>

        {order.detailed && order.subtotal !== undefined && (
          <div className="text-right">
            <p className="font-body text-2xs uppercase tracking-[0.16em] text-subtle">Total</p>
            <p className="font-display text-3xl text-plated">
              {formatPrice(order.subtotal, currency)}
            </p>
          </div>
        )}
      </div>

      {order.step > 0 && (
        <div className="mt-6">
          <div
            className="flex gap-1"
            role="img"
            aria-label={`Step ${order.step} of ${order.totalSteps}`}
          >
            {Array.from({ length: order.totalSteps }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < order.step ? 'bg-primary' : 'bg-subtle/20'
                }`}
              />
            ))}
          </div>
          <p className="mt-2 font-body text-2xs uppercase tracking-[0.14em] text-subtle">
            Step {order.step} of {order.totalSteps}
          </p>
        </div>
      )}

      {order.detailed && order.payment && (
        <div
          className={`mt-6 rounded-[--radius-plate] border p-4 ${
            order.payment.settled ? 'border-line' : 'border-primary/50'
          }`}
        >
          <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-subtle">
            Payment
          </p>
          <p className="mt-1 font-body text-sm text-ink">{order.payment.label}</p>
          {!order.payment.settled && (
            <p className="mt-2 text-2xs leading-relaxed text-muted">
              We confirm every transfer by hand before starting a belt. You will hear from us once
              it clears.
            </p>
          )}
        </div>
      )}

      {order.items.length > 0 && (
        <div className="mt-6">
          <h2 className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-subtle">
            {order.items.length === 1 ? 'Your belt' : 'Your belts'}
          </h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {order.items.map((item, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <span className="min-w-0 flex-1 text-sm text-ink">
                  <span className="text-muted">{item.quantity} &times;</span> {item.name}
                  {item.variantName && (
                    <span className="block text-2xs text-muted">{item.variantName}</span>
                  )}
                </span>
                {item.total !== null && (
                  <span className="shrink-0 font-body text-sm text-ink">
                    {formatPrice(item.total, currency)}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {order.detailed && order.subtotal !== undefined && (
            <div className="flex justify-between gap-4 pt-3">
              <span className="font-body text-sm font-semibold text-ink">Total</span>
              <span className="font-display text-xl text-plated">
                {formatPrice(order.subtotal, currency)}
              </span>
            </div>
          )}
        </div>
      )}

      {order.tracking ? (
        <div className="mt-6 rounded-[--radius-plate] border border-line p-4">
          <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-subtle">
            {order.tracking.carrier ?? 'Tracking'}
          </p>
          <p className="mt-1 font-body text-base tracking-wider text-ink">
            {order.tracking.number}
          </p>
        </div>
      ) : (
        order.detailed &&
        order.step > 0 &&
        order.step < 5 && (
          <p className="mt-6 text-2xs leading-relaxed text-muted">
            A tracking number appears here once your belt ships.
            {site.shipping.freeTo.length > 0 &&
              ` Free shipping to ${site.shipping.freeTo.join(', ')}.`}
          </p>
        )
      )}

      {order.detailed && order.customer && (
        <div className="mt-6 border-t border-line pt-4">
          <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-subtle">
            We will contact you on
          </p>
          <p className="mt-1 text-sm text-ink">
            {[order.customer.name, order.customer.email, order.customer.phone]
              .filter(Boolean)
              .join(' · ') || 'No contact details on this order'}
          </p>
          <p className="mt-1.5 text-2xs text-muted">
            Partly hidden for your privacy. Message us if any of it is wrong.
          </p>
        </div>
      )}

      {order.detailed && order.note && (
        <div className="mt-4">
          <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-subtle">
            Your notes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {order.note}
          </p>
        </div>
      )}

      <p className="mt-6 text-2xs text-subtle">
        Placed {longDate(order.placedAt)} · Updated {longDate(order.updatedAt)}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Ask about this order
          </a>
        )}
        <Link
          href="/track-order"
          className="font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle hover:text-link"
        >
          Track another order
        </Link>
      </div>
    </div>
  );
}
