import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';

export const metadata: Metadata = {
  title: 'Journal — Championship Belt Guides & Workshop Notes',
  description:
    'Guides on championship belt materials, sizing, plating and custom design from the M.A Champions Belts workshop.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  return (
    <InterimPage
      eyebrow="Journal"
      title="From the workshop"
      intro="Guides on materials, plating, sizing and the custom process are being written. The first posts land shortly."
      ctaLabel="Build your belt"
      ctaHref="/build"
    />
  );
}
