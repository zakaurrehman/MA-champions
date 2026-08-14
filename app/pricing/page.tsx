import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import Button from '@/components/ui/Button';
import { getMaterialTiers, hasUnconfirmedPricing } from '@/lib/tiers';
import { formatPrice } from '@/lib/format';
import type { TierCompare } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Championship Belt Pricing — Six Material Tiers Compared',
  description:
    'Compare championship belt pricing across six material tiers: brass, boxing, zinc, 24k gold, HD & CNC premium and fully custom. Plate metal, plating, etching and leather side by side.',
  alternates: { canonical: '/pricing' },
};

/**
 * A table, not cards.
 *
 * The competitor uses six separate cards, which forces the buyer to hold six
 * things in their head at once. A table lets them read one attribute across
 * all tiers — which is the actual question ("what do I get for the extra
 * $200?"). Cards remain on the homepage where the job is browsing, not
 * comparing.
 */

const ROWS: { key: keyof TierCompare; label: string }[] = [
  { key: 'plateMetal', label: 'Plate metal' },
  { key: 'plating', label: 'Plating' },
  { key: 'etching', label: 'Etching' },
  { key: 'leather', label: 'Leather' },
  { key: 'stones', label: 'Stone setting' },
  { key: 'weight', label: 'Weight' },
  { key: 'leadTime', label: 'Lead time' },
  { key: 'bestFor', label: 'Best for' },
];

export default async function PricingPage() {
  const tiers = await getMaterialTiers();
  const draft = await hasUnconfirmedPricing();

  return (
    <PageShell
      eyebrow="Pricing"
      title="Compare every tier"
      intro="The metal decides how sharp the detail reads, how much the belt weighs and what it costs. Here is every tier side by side, so you can see exactly what the next step up buys you."
    >
      {/* Table scrolls inside itself; the page never scrolls sideways. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Championship belt material tiers compared by price, plate metal, plating, etching,
            leather, stone setting, weight, lead time and best use.
          </caption>

          <thead>
            <tr>
              <th scope="col" className="w-36 border-b border-line pb-4 pr-4 align-bottom">
                <span className="font-body text-2xs font-semibold uppercase tracking-[0.18em] text-subtle">
                  Tier
                </span>
              </th>
              {tiers.map((tier) => (
                <th
                  key={tier.id}
                  scope="col"
                  className="border-b border-line px-4 pb-4 align-bottom"
                >
                  <span className="block font-display text-lg uppercase leading-none text-ink">
                    {tier.name}
                  </span>
                  <span className="mt-2 block font-display text-xl text-plated">
                    {formatPrice(tier.priceFloor)}
                    <span className="font-body text-2xs font-normal text-subtle"> from</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key} className="align-top">
                <th
                  scope="row"
                  className="border-b border-line/60 py-4 pr-4 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle"
                >
                  {row.label}
                </th>
                {tiers.map((tier) => {
                  const value = tier.compare[row.key];
                  return (
                    <td key={tier.id} className="border-b border-line/60 px-4 py-4 text-muted">
                      {value ?? (
                        // Not yet supplied — a dash is honest, a number would not be.
                        <span aria-label="Not yet confirmed" className="text-subtle">
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr>
              <th scope="row" className="py-5 pr-4">
                <span className="sr-only">Shop each tier</span>
              </th>
              {tiers.map((tier) => (
                <td key={tier.id} className="px-4 py-5">
                  <Link
                    href={`/collections/${tier.slug}`}
                    className="font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
                  >
                    Shop {tier.name} →
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {draft && (
        <p className="mt-6 text-2xs leading-relaxed text-subtle">
          Starting prices are indicative and confirmed on your written quote. Weight and lead
          time are shown as “—” where we have not published a confirmed figure.
        </p>
      )}

      <div className="mt-14 border-t border-line pt-10">
        <h2 className="text-2xl text-ink">Not sure which tier?</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          Build your belt in the configurator and the price updates as you choose. You will see
          exactly what each material does to the total before you send anything.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button href="/build" size="lg">
            Build your belt
          </Button>
          <Button href="/contact" variant="secondary" size="lg">
            Ask us
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
