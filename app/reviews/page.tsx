import type { Metadata } from 'next';
import { seoFor } from '@/lib/seoMeta';
import Image from 'next/image';
import PageShell from '@/components/ui/PageShell';
import StarRating from '@/components/ui/StarRating';
import EmptyState from '@/components/ui/EmptyState';
import { getReviews, getAggregateRating } from '@/lib/reviews';

export const metadata: Metadata = {
  ...seoFor("/reviews")!,
};

export default async function ReviewsPage() {
  const reviews = await getReviews();
  const aggregate = await getAggregateRating();

  return (
    <PageShell
      eyebrow="Reviews"
      title="What customers say"
      intro={
        aggregate
          ? `Rated ${aggregate.value} out of 5 from ${aggregate.count} ${
              aggregate.count === 1 ? 'review' : 'reviews'
            }.`
          : 'Reviews from people who have actually received a belt from us.'
      }
    >
      {reviews.length === 0 ? (
        <>
          <EmptyState
            title="No reviews published yet"
            body="We only publish reviews from customers we can verify against a real order, so this page stays empty until those come in. We would rather show you nothing than show you something invented."
          />
          <p className="mt-6 max-w-2xl text-2xs leading-relaxed text-subtle">
            {/* Deliberate and load-bearing: fabricated testimonials are unlawful
                under the FTC Act, the UK DMCC Act 2024 and the EU UCPD. */}
            Bought from us? Send us a photo and a line about it and we will add it here with
            your name.
          </p>
        </>
      ) : (
        <>
          <ul className="grid gap-6 md:grid-cols-2">
            {reviews.map((review) => (
              <li key={review.id}>
                <figure className="border-plate flex h-full flex-col overflow-hidden rounded-[--radius-plate] bg-surface">
                  {review.photo && (
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={review.photo}
                        alt={`Belt received by ${review.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <StarRating rating={review.rating} size="md" />
                    <blockquote className="mt-4 flex-1">
                      <p className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
                        {review.title}
                      </p>
                      <p className="mt-2.5 text-sm leading-relaxed text-muted">{review.body}</p>
                    </blockquote>
                    <figcaption className="mt-5 border-t border-line pt-4 text-2xs uppercase tracking-[0.14em] text-subtle">
                      {review.name}
                      {review.location && ` · ${review.location}`}
                      {review.verified && ' · Verified buyer'}
                      {' · '}
                      <time dateTime={review.date}>
                        {new Date(review.date).toLocaleDateString('en-GB', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                    </figcaption>
                  </div>
                </figure>
              </li>
            ))}
          </ul>

          {aggregate && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'Organization',
                  name: 'M.A Champions Belts',
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: aggregate.value,
                    reviewCount: aggregate.count,
                  },
                }),
              }}
            />
          )}
        </>
      )}
    </PageShell>
  );
}
