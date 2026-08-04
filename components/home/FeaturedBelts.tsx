import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import EmptyState from '@/components/ui/EmptyState';
import ProductCard from '@/components/product/ProductCard';
import { getFeaturedProducts } from '@/lib/products';

/**
 * Featured belts — capped at 8. Horizontal-scroll rail on mobile, grid above.
 *
 * Every product currently supplied is scoped to the custom gallery, so this
 * renders its empty state. It becomes a real rail the moment a shop-visible
 * product exists — no code change needed.
 */
export default async function FeaturedBelts() {
  const products = await getFeaturedProducts(8);

  return (
    <section className="border-t border-ink-line py-16 sm:py-20" aria-labelledby="featured-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Featured"
          title="Belts on the bench"
          titleId="featured-title"
          intro="A rotating selection of builds ready to ship or reorder."
          action={
            products.length > 0 ? (
              <Link
                href="/collections"
                className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-hi"
              >
                Shop all belts →
              </Link>
            ) : undefined
          }
        />

        {products.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Our catalogue is being photographed"
            body="We are reshooting every belt in the studio before it goes on sale. In the meantime the Belt Builder is fully open — spec yours and we will quote it."
          />
        ) : (
          <>
            {/* Mobile: rail. Scrolls inside itself, never the page. */}
            <div className="rail -mx-4 mt-12 flex gap-4 px-4 sm:hidden">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} fixedWidth priority={i === 0} />
              ))}
            </div>

            {/* Tablet and up: grid. */}
            <div className="mt-12 hidden gap-x-5 gap-y-10 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 2} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
