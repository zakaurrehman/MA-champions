import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';

export const metadata: Metadata = {
  title: 'Customer Reviews',
  description: 'Reviews and photos from M.A Champions Belts customers.',
  alternates: { canonical: '/reviews' },
};

export default function ReviewsPage() {
  return (
    <InterimPage
      eyebrow="Reviews"
      title="Customer reviews"
      intro="We are collecting verified reviews from customers and will publish them here with their photos. We do not post reviews we have not received."
      ctaLabel="Build your belt"
      ctaHref="/build"
    />
  );
}
