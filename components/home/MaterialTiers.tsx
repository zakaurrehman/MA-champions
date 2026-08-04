import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import { getMaterialTiers, hasUnconfirmedPricing } from '@/lib/tiers';
import { formatPrice } from '@/lib/products';

/**
 * Shop by material — the six tiers presented as a real comparison rather than
 * six decorative cards. Price floors are drafts until the client confirms, and
 * we say so plainly instead of passing drafts off as final.
 */
export default async function MaterialTiers() {
  const tiers = await getMaterialTiers();
  const draft = await hasUnconfirmedPricing();

  return (
    <section className="border-t border-line py-16 sm:py-20" aria-labelledby="tiers-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Shop by material"
          title="Six tiers, one workshop"
          titleId="tiers-title"
          intro="The metal decides how sharp the detail reads and how much the belt weighs. Everything below is made by us, on the same benches."
          action={
            <Link
              href="/pricing"
              className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-link transition-colors hover:text-link-hover"
            >
              Compare all tiers →
            </Link>
          }
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <li key={tier.id}>
              <Link
                href={`/collections/${tier.slug}`}
                className="border-plate plate-sheen group flex h-full flex-col rounded-[--radius-plate] bg-surface p-6 transition-colors duration-300 hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl text-ink transition-colors group-hover:text-link-hover">
                    {tier.name}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="mt-1 font-body text-2xs uppercase tracking-[0.18em] text-subtle"
                  >
                    0{tier.order}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-muted">{tier.blurb}</p>

                <ul className="mt-5 flex flex-col gap-2">
                  {tier.specBullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2.5 text-sm text-muted">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-baseline gap-2 border-t border-line pt-5">
                  <span className="font-body text-2xs uppercase tracking-[0.16em] text-subtle">
                    From
                  </span>
                  <span className="font-display text-2xl text-plated">
                    {formatPrice(tier.priceFloor)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {draft && (
          <p className="mt-6 text-2xs leading-relaxed text-subtle">
            {/* Visible, deliberate. Remove once data/tiers.json is confirmed. */}
            Indicative starting prices — final pricing is confirmed on your quote.
          </p>
        )}
      </div>
    </section>
  );
}
