import type { Metadata } from 'next';
import { seoFor } from '@/lib/seoMeta';
import PageShell from '@/components/ui/PageShell';
import Button from '@/components/ui/Button';
import { site, yearsInBusiness } from '@/lib/site';
import { FactoryIcon, GlobeIcon, HideIcon, PlatingIcon } from '@/components/ui/Icons';

export const metadata: Metadata = {
  ...seoFor("/about")!,
};

/**
 * Written from what the client has actually told us: in-house manufacturing,
 * real cowhide, 24k plating, worldwide shipping — plus material facts that are
 * true of the craft itself.
 *
 * Founding year, team size and workshop location are NOT invented. Each of
 * those sections renders only when the corresponding value exists in
 * lib/site.ts, so the page is honest today and gets richer the moment those
 * facts land. See TODO-BEFORE-LAUNCH.md.
 */

const STAGES = [
  {
    Icon: FactoryIcon,
    title: 'Cut and machined',
    body: 'Plates start as solid stock or a die-cast blank. On our CNC tiers the design is machined straight out of the metal, which is what produces relief deep enough to throw a real shadow.',
  },
  {
    Icon: PlatingIcon,
    title: 'Plated',
    body: 'Plates are polished before plating, not after. That base is what gives 24k gold its depth — plate over an unpolished surface and the finish looks flat no matter how much gold goes on.',
  },
  {
    Icon: HideIcon,
    title: 'Strapped',
    body: 'Straps are cut from full-grain cowhide, tooled, and on our premium builds finished with a sealed, painted edge rather than a raw cut one.',
  },
  {
    Icon: GlobeIcon,
    title: 'Assembled and shipped',
    body: 'Every plate is set and fixed to the strap by hand, checked, and packed for shipping anywhere in the world.',
  },
] as const;

export default function AboutPage() {
  const years = yearsInBusiness();

  return (
    <PageShell
      eyebrow="About"
      title="We make championship belts"
      intro="Not a reseller, not a drop-shipper. The belts we sell are the belts we build — cut, plated, stitched and assembled on our own benches."
    >
      <div className="max-w-2xl">
        <p className="text-base leading-relaxed text-muted">
          A championship belt is judged up close. People pick it up, turn it over, run a thumb
          across the etching. That is why we care more about plate depth and edge finish than
          about listing hundreds of designs — a belt that looks right in a photo and wrong in
          the hand is a belt that gets sent back.
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted">
          We build replica-style title belts, boxing and MMA belts, fantasy league trophies,
          corporate awards, and one-off commissions from customer artwork. Same benches, same
          people, whatever the order.
        </p>
        {years !== null && (
          <p className="mt-4 text-base leading-relaxed text-muted">
            We have been making belts for {years} years.
          </p>
        )}
      </div>

      <section aria-labelledby="how" className="mt-16">
        <h2 id="how" className="text-2xl text-ink">
          How a belt is made
        </h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-2">
          {STAGES.map(({ Icon, title, body }, i) => (
            <li key={title}>
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-gold" />
                <span className="font-display text-lg text-plated">0{i + 1}</span>
              </div>
              <h3 className="mt-3 font-body text-base font-semibold uppercase tracking-wide text-ink">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {site.address.city && (
        <section aria-labelledby="where" className="mt-16">
          <h2 id="where" className="text-2xl text-ink">
            Where we are
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Our workshop is in {[site.address.city, site.address.country].filter(Boolean).join(', ')}
            , and we ship worldwide.
          </p>
        </section>
      )}

      <div className="mt-16 border-t border-line pt-10">
        <h2 className="text-2xl text-ink">Have something in mind?</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          Spec it in the builder and we will quote it, or send us a sketch and we will draw it
          up.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button href="/build" size="lg">
            Build your belt
          </Button>
          <Button href="/custom" variant="secondary" size="lg">
            See our work
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
