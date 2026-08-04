import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Look up the status of your M.A Champions Belts order.',
  alternates: { canonical: '/track-order' },
  robots: { index: false, follow: true },
};

export default function TrackOrderPage() {
  return (
    <InterimPage
      eyebrow="Orders"
      title="Track your order"
      intro="Order lookup is being connected. If you have an order with us, reply to your order confirmation and we will send your current build stage and tracking number."
      ctaLabel="Contact us"
      ctaHref="/contact"
    />
  );
}
