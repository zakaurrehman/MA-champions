import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import StarRating from '@/components/ui/StarRating';
import { getReviews, getAggregateRating } from '@/lib/reviews';

/**
 * Testimonials.
 *
 * Renders nothing at all while there are no real reviews. A homepage that says
 * "no reviews yet" costs conversions, and inventing testimonials is unlawful —
 * so the section simply does not exist until data/reviews.json has entries.
 */
export default async function Reviews() {
  const reviews = await getReviews(3);
  if (reviews.length === 0) return null;

  const aggregate = await getAggregateRating();

  return (
    <section className="border-t border-ink-line py-16 sm:py-20" aria-labelledby="reviews-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Reviews"
          title="What customers say"
          titleId="reviews-title"
          intro={
            aggregate
              ? `Rated ${aggregate.value} out of 5 from ${aggregate.count} ${
                  aggregate.count === 1 ? 'review' : 'reviews'
                }.`
              : undefined
          }
          action={
            <Link
              href="/reviews"
              className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-hi"
            >
              Read all reviews →
            </Link>
          }
        />

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <figure className="border-plate flex h-full flex-col rounded-[--radius-plate] bg-ink-raised p-6">
                <StarRating rating={review.rating} size="md" />
                <blockquote className="mt-4 flex-1">
                  <p className="font-body text-sm font-semibold uppercase tracking-wide text-bone">
                    {review.title}
                  </p>
                  <p className="mt-2.5 text-sm leading-relaxed text-bone-dim">{review.body}</p>
                </blockquote>
                <figcaption className="mt-5 border-t border-ink-line pt-4 text-2xs uppercase tracking-[0.14em] text-nickel">
                  {review.name}
                  {review.location && ` · ${review.location}`}
                  {review.verified && ' · Verified buyer'}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
