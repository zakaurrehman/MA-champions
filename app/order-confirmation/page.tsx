import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import OrderConfirmation from '@/components/order/OrderConfirmation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order confirmed',
  // Never indexed: the URL carries an order reference and an access token.
  robots: { index: false, follow: false, nocache: true },
};

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; t?: string }>;
}) {
  const { ref, t } = await searchParams;

  const reference = String(ref ?? '')
    .trim()
    .toUpperCase();

  // Shape-checked here so an obviously bogus value never reaches the API.
  // The real authorisation happens server-side in /api/track.
  if (!/^MA-[A-Z0-9]{5}$/.test(reference)) {
    return (
      <PageShell
        eyebrow="Orders"
        title="Order not found"
        intro="That link is missing a valid order reference."
      >
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          If you have just paid, check your email or the message we sent for your reference, then
          look it up on the{' '}
          <Link href="/track-order" className="text-link hover:underline">
            track order page
          </Link>
          . If anything looks wrong, message us — we can find your order from your name and the
          date.
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Orders"
      title="Order confirmed"
      intro="Here is everything we hold for this order. Nothing else is needed from you right now."
    >
      <OrderConfirmation reference={reference} token={t ?? null} />
    </PageShell>
  );
}
