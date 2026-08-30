'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import type { Review } from '@/lib/reviews';
import ReviewPhotos from './ReviewPhotos';
import CustomerGallery from './CustomerGallery';
import { site, leadTimeLabel, fulfilmentFor, warrantyFor } from '@/lib/site';
import StarRating from '@/components/ui/StarRating';
import ReviewForm from './ReviewForm';

interface Props {
  product: Product;
  reviews: Review[];
}

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'shipping', label: 'Processing & Shipping' },
  { id: 'warranty', label: 'Warranty & Coverage' },
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
  const stockLead = leadTimeLabel('custom');
  const fulfilment = fulfilmentFor(product);
  const warranty = warrantyFor(product);

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
        {/* Headline summary — the single sentence buyers actually look for. */}
        <p className="max-w-2xl text-base leading-relaxed text-ink">
          This belt is processed in <strong>{fulfilment.processingTime}</strong> and arrives{' '}
          <strong>{fulfilment.shippingTime}</strong>.
        </p>

        <dl className="mt-7 grid max-w-2xl gap-5 sm:grid-cols-2">
          <div className="rounded-[--radius-plate] border border-line p-5">
            <dt className="font-body text-2xs font-semibold uppercase tracking-[0.18em] text-subtle">
              Processing time
            </dt>
            <dd className="mt-2 font-display text-2xl text-ink">{fulfilment.processingTime}</dd>
            <dd className="mt-1.5 text-2xs leading-relaxed text-muted">
              From order confirmation to dispatch.
            </dd>
          </div>

          <div className="rounded-[--radius-plate] border border-line p-5">
            <dt className="font-body text-2xs font-semibold uppercase tracking-[0.18em] text-subtle">
              Shipping time
            </dt>
            <dd className="mt-2 font-display text-2xl text-ink">{fulfilment.shippingTime}</dd>
            <dd className="mt-1.5 text-2xs leading-relaxed text-muted">
              Free to {site.shipping.freeTo.join(', ')}.
              {site.shipping.worldwide && ' Worldwide shipping available.'}
            </dd>
          </div>
        </dl>

        <dl className="mt-7 flex max-w-2xl flex-col gap-5">
          {stockLead && (
            <div>
              <dt className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
                Custom builds
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted">{stockLead}.</dd>
            </div>
          )}

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

      {/* Warranty & Coverage */}
      <div role="tabpanel" id="panel-warranty" aria-labelledby="tab-warranty" hidden={tab !== 'warranty'} className="py-8">
        {warranty.available ? (
          <div className="max-w-2xl">
            <p className="text-base leading-relaxed text-muted">{warranty.description}</p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {warranty.duration && (
                <li className="rounded-[--radius-plate] border border-line p-4">
                  <span className="block font-body text-2xs font-semibold uppercase tracking-[0.18em] text-subtle">
                    Warranty period
                  </span>
                  <span className="mt-1.5 block font-body text-sm font-semibold text-ink">
                    {warranty.duration}
                  </span>
                </li>
              )}
              {warranty.replacement && (
                <li className="rounded-[--radius-plate] border border-line p-4">
                  <span className="block font-body text-2xs font-semibold uppercase tracking-[0.18em] text-subtle">
                    Replacement
                  </span>
                  <span className="mt-1.5 block font-body text-sm font-semibold text-ink">
                    Available on qualifying faults
                  </span>
                </li>
              )}
              {warranty.exchange && (
                <li className="rounded-[--radius-plate] border border-line p-4">
                  <span className="block font-body text-2xs font-semibold uppercase tracking-[0.18em] text-subtle">
                    Exchange
                  </span>
                  <span className="mt-1.5 block font-body text-sm font-semibold text-ink">
                    Available on qualifying faults
                  </span>
                </li>
              )}
            </ul>

            <div className="mt-7 rounded-[--radius-plate] border border-line p-5">
              <h3 className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
                How to claim
              </h3>
              <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted">
                <li>Message us with your order details and photographs of the fault.</li>
                <li>We assess the claim against the warranty terms and confirm in writing.</li>
                <li>Where it qualifies, we arrange a replacement or exchange.</li>
              </ol>
              <Link
                href="/contact"
                className="mt-4 inline-block font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
              >
                Start a warranty claim →
              </Link>
            </div>
          </div>
        ) : (
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            This belt is not covered by our standard warranty. See our{' '}
            <Link href="/policies/refund" className="text-link underline-offset-4 hover:underline">
              refund policy
            </Link>{' '}
            for what applies.
          </p>
        )}
      </div>

      <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" hidden={tab !== 'reviews'} className="py-8">
        {/* Aggregate — only rendered when there is something real to average. */}
        {reviews.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-line pb-6">
            <span className="font-display text-4xl text-plated">
              {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
            </span>
            <div>
              <StarRating
                rating={reviews.reduce((s, r) => s + r.rating, 0) / reviews.length}
                size="md"
              />
              <p className="mt-1 font-body text-2xs uppercase tracking-[0.14em] text-subtle">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        )}

        <CustomerGallery
          photos={reviews.flatMap((r) => r.photos.map((url) => ({ url, author: r.name })))}
        />

        {reviews.length === 0 ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            No reviews for this belt yet. We publish reviews only from verified customers, so
            this stays empty until someone who bought it writes one.
          </p>
        ) : (
          <ul className="flex max-w-3xl flex-col gap-6">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-line/60 pb-6 last:border-0">
                <StarRating rating={review.rating} size="md" />
                <p className="mt-3 font-body text-sm font-semibold uppercase tracking-wide text-ink">
                  {review.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{review.body}</p>

                <ReviewPhotos photos={review.photos} authorName={review.name} />

                <p className="mt-3 text-2xs uppercase tracking-[0.14em] text-subtle">
                  {review.name}
                  {review.verified && ' · Verified buyer'}
                  {review.date && ` · ${new Date(review.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}`}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-9 border-t border-line pt-8">
          <ReviewForm productName={product.name} productSlug={product.slug} />
        </div>
      </div>
    </div>
  );
}
