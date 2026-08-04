import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';

export const metadata: Metadata = {
  title: 'FAQs — Lead Times, Sizing, Materials & Shipping',
  description:
    'Answers on championship belt lead times, sizing, the custom design process, materials, payment and returns.',
  alternates: { canonical: '/faqs' },
};

export default function FaqsPage() {
  return (
    <InterimPage
      eyebrow="FAQs"
      title="Questions, answered"
      intro="We are finalising confirmed answers on lead times, shipping, sizing and the custom process — we would rather publish nothing than publish a lead time we cannot hold. Ask us directly in the meantime."
      ctaLabel="Ask us"
      ctaHref="/contact"
    />
  );
}
