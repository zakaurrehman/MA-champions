import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search championship belts by name, material or sport.',
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <InterimPage
      eyebrow="Search"
      title="Search belts"
      intro="Fuzzy search across belt names, materials and sports is being wired up. Browse by material or sport in the meantime."
      ctaLabel="Browse collections"
      ctaHref="/collections"
    />
  );
}
