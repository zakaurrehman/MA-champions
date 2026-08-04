import type { Metadata } from 'next';
import PageShell from '@/components/ui/PageShell';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description: 'Check the status of your M.A Champions Belts order.',
  alternates: { canonical: '/track-order' },
  robots: { index: false, follow: true },
};

/**
 * There is no order database in v1, so this is an assisted lookup rather than
 * a fake tracking widget. A form that returns invented statuses would be worse
 * than one that reaches a human.
 *
 * TODO: when orders are stored, replace this with a real lookup by order
 * number + email.
 */
export default function TrackOrderPage() {
  return (
    <PageShell
      eyebrow="Orders"
      title="Track your order"
      intro="Send us your order number and we will come back with your current build stage and, once it has shipped, your tracking number."
    >
      <ContactForm
        subject="Order status request"
        referenceLabel="Order number"
        messageLabel="Anything else?"
        messagePlaceholder="Date ordered, name on the order, or anything that helps us find it…"
      />
    </PageShell>
  );
}
