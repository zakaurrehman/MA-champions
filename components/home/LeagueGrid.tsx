import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import { LEAGUE_COLLECTIONS } from '@/lib/tiers';
import { collectionCounts, MIN_LISTED } from '@/lib/collectionCounts';

/** Below this many stocked sports, a grid looks empty — show one band instead. */
const MIN_FOR_GRID = 3;

/**
 * Shop by sport.
 *
 * Deliberately uses sport names, not league trademarks — "Football", not the
 * NFL wordmark. The searchable phrase stays in the slug and blurb.
 *
 * Only sports with belts in stock get a tile. Every tile used to link to a page
 * saying "Nothing listed here yet", which told a visitor the shop was empty.
 * Until enough sports are stocked, the section becomes a single invitation to
 * have one built — which is true today, since every league belt is made to
 * order anyway.
 */
export default async function LeagueGrid() {
  const counts = await collectionCounts();
  const leagues = LEAGUE_COLLECTIONS.filter(
    (league) => (counts.get(league.slug) ?? 0) >= MIN_LISTED
  );

  if (leagues.length < MIN_FOR_GRID) {
    return (
      <section className="border-t border-line py-14 sm:py-16" aria-labelledby="leagues-title">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Leagues, teams &amp; fantasy
            </p>
            <h2 id="leagues-title" className="mt-2 text-3xl text-ink">
              Running a league? We will build its title belt
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Fantasy football, gym champions, company awards, club trophies — designed around
              your name and logo, and made to order in our workshop.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button href="/build" size="lg">
              Design your league belt
            </Button>
            {leagues.map((league) => (
              <Button key={league.id} href={`/collections/${league.slug}`} variant="secondary" size="lg">
                Shop {league.name}
              </Button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-line py-16 sm:py-20" aria-labelledby="leagues-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Shop by sport"
          title="Find your league"
          titleId="leagues-title"
          intro="Season trophies, championship title belts and fantasy league silverware — built for the sport you actually play."
        />

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {leagues.map((league) => (
            <li key={league.id}>
              <Link
                href={`/collections/${league.slug}`}
                className="border-plate group flex h-full flex-col justify-between gap-6 rounded-[--radius-plate] bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
              >
                <span
                  aria-hidden="true"
                  className="block h-px w-8 bg-plated transition-all duration-300 group-hover:w-14"
                />
                <span>
                  <span className="block font-display text-lg uppercase leading-none text-ink transition-colors group-hover:text-link-hover">
                    {league.name}
                  </span>
                  <span className="mt-2 block text-2xs leading-snug text-muted">
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
