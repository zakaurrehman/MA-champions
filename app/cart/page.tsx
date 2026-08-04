import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Your cart.',
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <InterimPage
      eyebrow="Cart"
      title="Your cart is empty"
      intro="Nothing in the cart yet. Custom belts are quoted rather than checked out — start a build and we will send you a written price."
      ctaLabel="Build your belt"
      ctaHref="/build"
      secondaryLabel="Browse collections"
      secondaryHref="/collections"
    />
  );
}
