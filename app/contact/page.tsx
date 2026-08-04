import type { Metadata } from 'next';
import InterimPage from '@/components/ui/InterimPage';
import { site, hasEmail, hasWhatsApp } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with M.A Champions Belts about a custom championship belt, a quote or an existing order.',
  alternates: { canonical: '/contact' },
};

/**
 * TODO: contact details are not yet in lib/site.ts. Until they land, this page
 * cannot print a phone number, email or address — so it says so plainly rather
 * than showing a form that submits nowhere.
 */
export default function ContactPage() {
  const reachable = hasEmail() || hasWhatsApp();

  return (
    <InterimPage
      eyebrow="Contact"
      title="Talk to us"
      intro={
        reachable
          ? `Message us on WhatsApp or email ${site.email ?? ''} and we will come back to you within one working day. The full contact form, map and address land shortly.`
          : 'Our contact form, WhatsApp line and workshop address are being set up now. If you have reached this page, the fastest route is to start a build — every submission comes straight to us with your full spec attached.'
      }
      ctaLabel="Start a build"
      ctaHref="/build"
    />
  );
}
