import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import { getMaterialTiers } from '@/lib/tiers';
import { LEAGUE_COLLECTIONS } from '@/lib/tiers';
import { formatPrice } from '@/lib/products';

export const metadata: Metadata = {
  title: 'All Collections — Championship Belts by Material & Sport',
  description:
    'Browse championship belts by material tier — brass, boxing, zinc, 24k gold, HD & CNC and fully custom — or by sport.',
  alternates: { canonical: '/collections' },
};

export default async function CollectionsPage() {
  const tiers = await getMaterialTiers();

  return (
    <PageShell
      eyebrow="Collections"
      title="Every belt we build"
      intro="Shop by the metal it is made from, or by the sport it is for."
    >
      <section aria-labelledby="by-material">
        <h2 id="by-material" className="text-2xl text-bone">
          By material
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <li key={tier.id}>
              <Link
                href={`/collections/${tier.slug}`}
                className="border-plate flex items-baseline justify-between gap-4 rounded-[--radius-plate] bg-ink-raised px-5 py-4 transition-colors hover:border-gold/40"
              >
                <span className="font-body text-sm font-semibold text-bone">{tier.name}</span>
                <span className="font-display text-base text-plated">
                  {formatPrice(tier.priceFloor)}+
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="by-sport" className="mt-14">
        <h2 id="by-sport" className="text-2xl text-bone">
          By sport
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {LEAGUE_COLLECTIONS.map((league) => (
            <li key={league.id}>
              <Link
                href={`/collections/${league.slug}`}
                className="border-plate block rounded-[--radius-plate] bg-ink-raised px-5 py-4 font-body text-sm font-semibold text-bone transition-colors hover:border-gold/40 hover:text-gold-hi"
              >
                {league.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
