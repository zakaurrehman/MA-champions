import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import EmptyState from '@/components/ui/EmptyState';
import ProductCard from '@/components/product/ProductCard';
import { getFeaturedProducts } from '@/lib/products';
import { ALL_BELTS_SLUG } from '@/lib/tiers';

/**
 * The shop, on the homepage.
 *
 * Shows the ENTIRE catalogue rather than a curated handful: a visitor should
 * be able to see everything we sell without a second click, which is the whole
 * point of putting products directly under the hero. Products flagged
 * `featured` sort to the front.
 *
 * Mobile keeps the horizontal rail so a long catalogue does not turn into an
 * endless scroll on a phone.
 */
export default async function FeaturedBelts() {
  const products = await getFeaturedProducts();

  return (
    <section className="border-t border-line py-16 sm:py-20" aria-labelledby="featured-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Shop"
          title="Belts on the bench"
          titleId="featured-title"
          intro={
            products.length > 0
              ? `${products.length} builds ready to order, every one made in-house.`
              : 'A rotating selection of builds ready to ship or reorder.'
          }
          action={
            products.length > 0 ? (
              <Link
                href={`/collections/${ALL_BELTS_SLUG}`}
                className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-link transition-colors hover:text-link-hover"
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
