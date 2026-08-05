'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import type { Review } from '@/lib/reviews';
import { site, leadTimeLabel } from '@/lib/site';
import StarRating from '@/components/ui/StarRating';

interface Props {
  product: Product;
  reviews: Review[];
}

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'shipping', label: 'Shipping & Lead Time' },
  { id: 'reviews', label: 'Reviews' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** Spec rows hide any value still carrying a TODO marker rather than print it. */
function specRows(product: Product): [string, string][] {
  const s = product.specs;
  const all: [string, string][] = [
    ['Plate material', s.plateMaterial],
    ['Plate thickness', s.plateThickness],
    ['Plating', s.plating],
    ['Leather', s.leatherType],
    ['Leather colour', s.leatherColour],
    ['Plate count', String(s.plateCount)],
    ['Weight', s.weight],
    ['Size', s.size],
    ['Stone setting', s.stones],
  ];
  return all.filter(([, value]) => value && !value.startsWith('TODO'));
}

export default function ProductTabs({ product, reviews }: Props) {
  const [tab, setTab] = useState<TabId>('description');
  const rows = specRows(product);
  const stockLead = leadTimeLabel('stock');

  return (
    <div className="border-t border-line pt-10">
      <div
        role="tablist"
        aria-label="Product details"
        className="rail flex gap-1 border-b border-line"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 font-body text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
              tab === t.id
                ? 'border-primary text-link'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
            {t.id === 'reviews' && reviews.length > 0 && ` (${reviews.length})`}
          </button>
        ))}
      </div>

      {/*
        Every panel is rendered, with inactive ones carrying `hidden`, rather
        than being conditionally mounted. Conditional mounting kept the specs,
        shipping and lead-time copy out of the HTML entirely — invisible to
        crawlers, on exactly the content that does the selling.
      */}

      <div role="tabpanel" id="panel-description" aria-labelledby="tab-description" hidden={tab !== 'description'} className="py-8">
        <p className="max-w-2xl text-base leading-relaxed text-muted">{product.description}</p>
      </div>

      <div role="tabpanel" id="panel-specifications" aria-labelledby="tab-specifications" hidden={tab !== 'specifications'} className="py-8">
        {/* Wrapped so a long spec value can never push the page sideways. */}
        <div className="overflow-x-auto">
          <table className="w-full max-w-2xl text-left text-sm">
            <caption className="sr-only">Specifications for {product.name}</caption>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b border-line/60">
                  <th
                    scope="row"
                    className="w-44 py-3 pr-4 align-top font-body font-semibold text-ink"
                  >
                    {label}
                  </th>
                  <td className="py-3 text-muted">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div role="tabpanel" id="panel-shipping" aria-labelledby="tab-shipping" hidden={tab !== 'shipping'} className="py-8">
        <dl className="flex max-w-2xl flex-col gap-5">
          <div>
            <dt className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
              Build time
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              {stockLead
                ? `${stockLead}, before shipping.`
                : /* No confirmed lead time — say so plainly rather than guess one. */
                  'Confirmed in writing on your quote before you pay. We do not quote a build time we cannot hold.'}
            </dd>
          </div>

          <div>
            <dt className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
              Shipping
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              Free to {site.shipping.freeTo.join(', ')}.
              {site.shipping.worldwide && ' We ship worldwide.'}
              {site.leadTimes.shippingDays && ` Transit is typically ${site.leadTimes.shippingDays}.`}
            </dd>
          </div>

          <div>
            <dt className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
              Returns
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">
              See our{' '}
              <Link href="/policies/refund" className="text-link underline-offset-4 hover:underline">
                refund policy
              </Link>
              . Engraved and made-to-order belts are treated differently from stock items.
            </dd>
          </div>
        </dl>
      </div>

      <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" hidden={tab !== 'reviews'} className="py-8">
        {reviews.length === 0 ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            No reviews for this belt yet. We publish reviews only from verified customers, so
            this stays empty until someone who bought it writes one.
          </p>
        ) : (
          <ul className="flex max-w-2xl flex-col gap-6">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-line/60 pb-6 last:border-0">
                <StarRating rating={review.rating} size="md" />
                <p className="mt-3 font-body text-sm font-semibold uppercase tracking-wide text-ink">
                  {review.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{review.body}</p>
                <p className="mt-3 text-2xs uppercase tracking-[0.14em] text-subtle">
                  {review.name}
                  {review.verified && ' · Verified buyer'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
