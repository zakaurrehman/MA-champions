import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import { getMaterialTiers, LEAGUE_COLLECTIONS, ALL_BELTS_SLUG } from '@/lib/tiers';
import { getShopProducts } from '@/lib/products';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = {
  title: 'All Collections — Championship Belts by Material & Sport',
  description:
    'Browse championship belts by material tier — brass, boxing, zinc, 24k gold, HD & CNC and fully custom — or by sport.',
  alternates: { canonical: '/collections' },
};

export default async function CollectionsPage() {
  const tiers = await getMaterialTiers();
  const productCount = (await getShopProducts()).length;

  return (
    <PageShell
      eyebrow="Collections"
      title="Every belt we build"
      intro="Shop by the metal it is made from, or by the sport it is for."
    >
      {/* The catch-all shelf leads: browsing by material only helps someone who
          already knows which metal they want. */}
      <Link
        href={`/collections/${ALL_BELTS_SLUG}`}
        className="border-plate mb-14 flex flex-wrap items-center justify-between gap-4 rounded-[--radius-plate] bg-surface px-6 py-5 transition-colors hover:border-primary/40"
      >
        <span>
          <span className="block font-display text-xl uppercase text-ink">All belts</span>
          <span className="mt-1 block font-body text-sm text-muted">
            {productCount} builds, filterable by material, price and sport
          </span>
        </span>
        <span className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-link">
          Browse all →
        </span>
      </Link>

      <section aria-labelledby="by-material">
        <h2 id="by-material" className="text-2xl text-ink">
          By material
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <li key={tier.id}>
              <Link
                href={`/collections/${tier.slug}`}
                className="border-plate flex items-baseline justify-between gap-4 rounded-[--radius-plate] bg-surface px-5 py-4 transition-colors hover:border-primary/40"
              >
                <span className="font-body text-sm font-semibold text-ink">{tier.name}</span>
                <span className="font-display text-base text-plated">
                  {formatPrice(tier.priceFloor)}+
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="by-sport" className="mt-14">
        <h2 id="by-sport" className="text-2xl text-ink">
          By sport
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {LEAGUE_COLLECTIONS.map((league) => (
            <li key={league.id}>
              <Link
                href={`/collections/${league.slug}`}
                className="border-plate block rounded-[--radius-plate] bg-surface px-5 py-4 font-body text-sm font-semibold text-ink transition-colors hover:border-primary/40 hover:text-link-hover"
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
