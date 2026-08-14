import type { Metadata } from 'next';
import PageShell from '@/components/ui/PageShell';
import CartView from '@/components/cart/CartView';
import { paypalClientId } from '@/lib/paypal';

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review your championship belt order.',
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: true },
};

/* Reads PAYPAL_CLIENT_ID at request time. The client id is public by design —
   the secret stays on the server and is never sent here. */
export const dynamic = 'force-dynamic';

export default function CartPage() {
  return (
    <PageShell eyebrow="Cart" title="Your order">
      <CartView paypalClientId={paypalClientId()} />
    </PageShell>
  );
}
