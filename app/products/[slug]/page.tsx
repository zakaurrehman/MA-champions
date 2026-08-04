import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getProductBySlug,
  getShopProducts,
  getRelatedProducts,
  formatPrice,
} from '@/lib/products';
import { getReviewsForProduct } from '@/lib/reviews';
import ProductGallery from '@/components/product/ProductGallery';
import BuyBox from '@/components/product/BuyBox';
import ProductTabs from '@/components/product/ProductTabs';
import ProductCard from '@/components/product/ProductCard';
import SectionHeading from '@/components/ui/SectionHeading';

interface Params {
  params: Promise<{ slug: string }>;
}

/**
 * Only shop-visible products get a route. Anything scoped to the custom
 * gallery 404s here rather than leaking a purchasable-looking page.
 */
export async function generateStaticParams() {
  const products = await getShopProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Belt not found' };

  const image = product.images[0];

  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      type: 'website',
      images: image ? [{ url: image.src, alt: image.alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related] = await Promise.all([
    getReviewsForProduct(slug),
    getRelatedProducts(product),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-2 text-2xs uppercase tracking-[0.14em] text-nickel">
          <li>
            <Link href="/" className="hover:text-gold">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/collections" className="hover:text-gold">
              Collections
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-bone-dim">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <h1 className="text-3xl text-bone sm:text-4xl">{product.name}</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-bone-dim">
            {product.shortDescription}
          </p>

          <div className="mt-8">
            <BuyBox product={product} />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <ProductTabs product={product} reviews={reviews} />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-16 border-t border-ink-line pt-14">
          <SectionHeading eyebrow="More belts" title="You might also like" titleId="related-title" />
          <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Product structured data. Expanded with aggregateRating in Phase 6. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.shortDescription,
            image: product.images.map((i) => i.src),
            offers: {
              '@type': 'Offer',
              price: product.salePrice ?? product.price,
              priceCurrency: product.currency,
              availability: product.inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
          }),
        }}
      />

      <p className="sr-only">
        Listed from {formatPrice(product.salePrice ?? product.price, product.currency)}
      </p>
    </div>
  );
}
