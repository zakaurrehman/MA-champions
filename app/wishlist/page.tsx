import type { Metadata } from 'next';
import PageShell from '@/components/ui/PageShell';
import WishlistView from '@/components/wishlist/WishlistView';
import { getShopProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Belts you have saved.',
  alternates: { canonical: '/wishlist' },
  robots: { index: false, follow: true },
};

export default async function WishlistPage() {
  const products = await getShopProducts();

  return (
    <PageShell
      eyebrow="Wishlist"
      title="Saved belts"
      intro="Kept on this device. No account, no sign-up."
    >
      <WishlistView products={products} />
    </PageShell>
  );
}
