import type { Metadata } from 'next';
import PageShell from '@/components/ui/PageShell';
import CartView from '@/components/cart/CartView';

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review your championship belt order.',
  alternates: { canonical: '/cart' },
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <PageShell eyebrow="Cart" title="Your order">
      <CartView />
    </PageShell>
  );
}
