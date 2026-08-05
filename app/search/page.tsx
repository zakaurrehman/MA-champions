import type { Metadata } from 'next';
import PageShell from '@/components/ui/PageShell';
import SearchView from '@/components/search/SearchView';
import { getShopProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search championship belts, replica title belts and custom builds.',
  alternates: { canonical: '/search' },
  robots: { index: false, follow: true },
};

export default async function SearchPage() {
  // The catalogue ships with the page and search runs client-side, so results
  // are instant and keep working offline. Revisit if the catalogue passes a
  // few thousand products.
  const products = await getShopProducts();

  return (
    <PageShell eyebrow="Search" title="Find your belt">
      <SearchView products={products} />
    </PageShell>
  );
}
