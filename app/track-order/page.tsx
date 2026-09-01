import type { Metadata } from 'next';
import { seoFor } from '@/lib/seoMeta';
import PageShell from '@/components/ui/PageShell';
import TrackOrderLookup from '@/components/contact/TrackOrderLookup';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  ...seoFor("/track-order")!,
  robots: { index: false, follow: true },
};

export default function TrackOrderPage() {
  return (
    <PageShell
      eyebrow="Orders"
      title="Track your order"
      intro="Enter the reference we sent you and we will show you exactly where your belt is."
    >
      <TrackOrderLookup />

      <section className="mt-16 border-t border-line pt-10">
        <h2 className="text-2xl text-ink">Lost your reference?</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          No problem — send us the name you ordered under and roughly when, and we will find it.
        </p>
        <div className="mt-7">
          <ContactForm
            subject="Order status request"
            messageLabel="Anything else?"
            messagePlaceholder="Date ordered, name on the order, or anything that helps us find it…"
          />
        </div>
      </section>
    </PageShell>
  );
}
