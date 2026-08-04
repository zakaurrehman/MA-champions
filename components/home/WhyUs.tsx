import SectionHeading from '@/components/ui/SectionHeading';
import { FactoryIcon, GlobeIcon, HideIcon, PlatingIcon } from '@/components/ui/Icons';

const POINTS = [
  {
    Icon: FactoryIcon,
    title: 'Made in-house',
    body: 'Cut, plated, stitched and assembled on our own benches. No middleman, no white-label supplier.',
  },
  {
    Icon: HideIcon,
    title: 'Real cowhide',
    body: 'Full-grain leather straps with sealed, painted edges — not bonded leather or vinyl.',
  },
  {
    Icon: PlatingIcon,
    title: 'True 24k plating',
    body: 'Genuine gold plating over a polished base, so the finish holds its depth instead of yellowing.',
  },
  {
    Icon: GlobeIcon,
    title: 'Shipped worldwide',
    body: 'Free delivery to the USA, Canada and the UK, with tracked shipping everywhere else.',
  },
] as const;

export default function WhyUs() {
  return (
    <section className="border-t border-ink-line py-16 sm:py-20" aria-labelledby="why-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Why us" title="What you actually get" titleId="why-title" />

        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(({ Icon, title, body }) => (
            <li key={title}>
              <Icon className="h-7 w-7 text-gold" />
              <h3 className="mt-4 font-body text-base font-semibold uppercase tracking-wide text-bone">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-bone-dim">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
