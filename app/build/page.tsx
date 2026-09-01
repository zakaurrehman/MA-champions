import type { Metadata } from 'next';
import { seoFor } from '@/lib/seoMeta';
import PageShell from '@/components/ui/PageShell';
import BuildRouteSwitch from '@/components/builder/BuildRouteSwitch';

export const metadata: Metadata = {
  ...seoFor("/build")!,
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
