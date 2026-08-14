import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import ProductForm from '@/components/admin/ProductForm';
import { getAllProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Edit belt — Admin',
  robots: { index: false, follow: false, nocache: true },
};

interface Params {
  params: Promise<{ slug: string }>;
}

export default async function AdminProductPage({ params }: Params) {
  const { slug } = await params;
  const isNew = slug === 'new';

  // getAllProducts, not getShopProducts: a hidden belt still needs editing,
  // and that is exactly how it gets un-hidden.
  const product = isNew ? null : (await getAllProducts()).find((p) => p.slug === slug) ?? null;

  if (!isNew && !product) notFound();

  return (
    <AdminShell
      title={isNew ? 'New belt' : (product?.name ?? 'Edit belt')}
      intro={
        isNew
          ? 'Add a belt to the catalogue. It goes live as soon as you save, unless you untick “Visible in shop”.'
          : `Editing /products/${slug}`
      }
    >
      <ProductForm product={product} />
    </AdminShell>
  );
}
