import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';

export const metadata: Metadata = {
  title: 'About M.A Champions Belts — Our Workshop',
  description:
    'M.A Champions Belts makes custom championship belts and replica title belts in-house, from real cowhide and deep-etched metal.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <InterimPage
      eyebrow="About"
      title="Our workshop"
      intro="The full story — our factory, our craftsmen and how a belt goes from drawing to finished piece — is being written with the team. Meanwhile, the custom work page shows what comes off our benches."
      ctaLabel="See our work"
      ctaHref="/custom"
    />
  );
}
