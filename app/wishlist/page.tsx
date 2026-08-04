import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Belts you have saved.',
  alternates: { canonical: '/wishlist' },
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <InterimPage
      eyebrow="Wishlist"
      title="Your wishlist is empty"
      intro="Save belts as you browse and they will collect here. Nothing saved yet."
      ctaLabel="Browse collections"
      ctaHref="/collections"
    />
  );
}
