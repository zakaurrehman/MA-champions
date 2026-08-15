import type { Metadata } from 'next';
import PageShell from '@/components/ui/PageShell';
import BuildRouteSwitch from '@/components/builder/BuildRouteSwitch';

export const metadata: Metadata = {
  title: 'Belt Builder — Design Your Own Championship Belt',
  description:
    'Design your own custom championship belt online: choose the silhouette, plate material and count, leather and stitching colour, upload your artwork, add nameplate engraving and see it change live. Free quote.',
  alternates: { canonical: '/build' },
  openGraph: {
    title: 'Design Your Own Championship Belt — M.A Champions Belts',
    description:
      'A real visual belt configurator. Pick your silhouette, plates, leather and engraving and watch the belt change as you build it.',
  },
};

export default function BuildPage() {
  return (
    <PageShell
      eyebrow="Belt Builder"
      title="Design your own championship belt"
      intro="Build it on screen and watch every choice change the belt, or send us your own design and specs. Either way it comes to us as a quote request — nothing is charged and nothing is cut until you approve a design."
    >
      <BuildRouteSwitch />
    </PageShell>
  );
}
