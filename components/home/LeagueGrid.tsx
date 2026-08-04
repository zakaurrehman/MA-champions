import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import { LEAGUE_COLLECTIONS } from '@/lib/tiers';

/**
 * Shop by sport.
 *
 * Deliberately uses sport names, not league trademarks — "Football", not the
 * NFL wordmark. The searchable phrase stays in the slug and blurb.
 */
export default function LeagueGrid() {
  return (
    <section className="border-t border-ink-line py-16 sm:py-20" aria-labelledby="leagues-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Shop by sport"
          title="Find your league"
          titleId="leagues-title"
          intro="Season trophies, championship title belts and fantasy league silverware — built for the sport you actually play."
        />

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {LEAGUE_COLLECTIONS.map((league) => (
            <li key={league.id}>
              <Link
                href={`/collections/${league.slug}`}
                className="border-plate group flex h-full flex-col justify-between gap-6 rounded-[--radius-plate] bg-ink-raised p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40"
              >
                <span
                  aria-hidden="true"
                  className="block h-px w-8 bg-plated transition-all duration-300 group-hover:w-14"
                />
                <span>
                  <span className="block font-display text-lg uppercase leading-none text-bone transition-colors group-hover:text-gold-hi">
                    {league.name}
                  </span>
                  <span className="mt-2 block text-2xs leading-snug text-bone-dim">
                    {league.blurb}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
