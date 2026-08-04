import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';

export const metadata: Metadata = {
  title: 'Championship Belt Pricing — Six Material Tiers Compared',
  description:
    'Compare championship belt pricing across all six material tiers: brass, boxing, zinc, 24k gold, HD & CNC premium and fully custom.',
  alternates: { canonical: '/pricing' },
};

export default function PricingPage() {
  return (
    <InterimPage
      eyebrow="Pricing"
      title="Compare every tier"
      intro="The full side-by-side comparison table — plate material, plating, leather, plate count, weight and lead time across all six tiers — is being finalised against confirmed pricing. Starting prices are on the homepage now."
      ctaLabel="See starting prices"
      ctaHref="/#tiers"
      secondaryLabel="Browse collections"
      secondaryHref="/collections"
    />
  );
}
