import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import AdminShell from '@/components/admin/AdminShell';
import DeleteProductButton from '@/components/admin/DeleteProductButton';
import { getAllProducts } from '@/lib/products';
import { resolvePrice } from '@/lib/pricing';
import { formatPrice } from '@/lib/format';
import { hasDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Products — Admin',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminProductsPage() {
  const products = await getAllProducts();
  const dbReady = hasDatabase();

  return (
    <AdminShell
      title="Products"
      intro={`${products.length} belts in the catalogue.`}
      action={
        <Link
          href="/admin/products/new"
          className="rounded-[--radius-plate] bg-primary px-5 py-3 font-display text-sm uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover"
        >
          New belt
        </Link>
      }
    >
      {!dbReady && (
        <p className="mb-6 rounded-[--radius-plate] border border-line px-5 py-4 text-sm leading-relaxed text-muted">
          <strong className="text-ink">Read-only.</strong> No DATABASE_URL is configured, so this
          list is coming from the JSON seed and edits cannot be saved. Add the variable and run{' '}
          <code>npm run migrate</code>.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {products.map((product) => {
          const price = resolvePrice(product);
          const image = product.images[0];

          return (
            <li
              key={product.slug}
              className="flex flex-wrap items-center gap-4 rounded-[--radius-plate] border border-line p-3 sm:flex-nowrap"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[--radius-plate] bg-surface">
                {image && (
                  <Image src={image.src} alt="" fill sizes="64px" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-semibold text-ink">{product.name}</p>
                <p className="mt-0.5 truncate text-2xs text-muted">
                  {product.materialTier} · {product.images.length} image
                  {product.images.length === 1 ? '' : 's'}
                  {product.variants && product.variants.length > 0
                    ? ` · ${product.variants.length} builds`
                    : ''}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-display text-lg text-plated">
                  {formatPrice(price.current, product.currency)}
                </p>
                {price.discountPercent !== null && (
                  <p className="text-2xs text-subtle">−{price.discountPercent}%</p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {!product.visibility.shop && (
                  <span className="rounded-[--radius-plate] border border-subtle/40 px-2 py-1 font-body text-2xs uppercase tracking-[0.14em] text-subtle">
                    Hidden
                  </span>
                )}
                <Link
                  href={`/admin/products/${product.slug}`}
                  className="rounded-[--radius-plate] border border-subtle/40 px-4 py-2 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-primary hover:text-link"
                >
                  Edit
                </Link>
                <DeleteProductButton slug={product.slug} name={product.name} />
              </div>
            </li>
          );
        })}
      </ul>
    </AdminShell>
  );
}
