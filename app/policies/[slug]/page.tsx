import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import InterimPage from '@/components/ui/InterimPage';

/**
 * Policy pages.
 *
 * TODO (Phase 4): these need real legal copy. Refund windows, shipping terms
 * and warranty periods are business facts we do not hold, and publishing
 * placeholder legal text is worse than publishing none — a stated refund
 * window is contractually binding once live.
 */
const POLICIES = {
  privacy: {
    title: 'Privacy Policy',
    intro:
      'Our privacy policy is being prepared. It will cover what we collect when you request a quote or place an order, how long we keep it, and who we share it with.',
  },
  refund: {
    title: 'Refund Policy',
    intro:
      'Our refund and returns policy is being finalised. Custom belts are made to order, so terms differ from stock items — we will publish exact windows rather than approximate ones.',
  },
  shipping: {
    title: 'Shipping Policy',
    intro:
      'Our shipping policy is being finalised, including confirmed build and transit times by destination. Free shipping applies to the USA, Canada and the UK.',
  },
  terms: {
    title: 'Terms of Service',
    intro: 'Our terms of service are being prepared and will be published before checkout opens.',
  },
} as const;

type PolicySlug = keyof typeof POLICIES;

interface Params {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug as PolicySlug];
  if (!policy) return { title: 'Policy not found' };

  return {
    title: policy.title,
    description: policy.intro,
    alternates: { canonical: `/policies/${slug}` },
  };
}

export default async function PolicyPage({ params }: Params) {
  const { slug } = await params;
  const policy = POLICIES[slug as PolicySlug];
  if (!policy) notFound();

  return (
    <InterimPage
      eyebrow="Policies"
      title={policy.title}
      intro={policy.intro}
      ctaLabel="Contact us"
      ctaHref="/contact"
    />
  );
}
