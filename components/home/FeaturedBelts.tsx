import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/product/ProductCard';
import { getFeaturedProducts, getShopProducts } from '@/lib/products';
import { ALL_BELTS_SLUG } from '@/lib/tiers';

/** How many belts the homepage shows. The rest are one click away. */
const HOMEPAGE_BELTS = 8;

/**
 * A short selection of belts, directly under the hero.
 *
 * This used to render the ENTIRE catalogue — and render it twice, once as a
 * phone carousel and once as a desktop grid, with CSS hiding one of them. At 80
 * belts that was 1.6 MB of HTML and about twenty rows of cards on desktop
 * before a visitor reached anything else on the page. Showing everything is
 * what the collection page is for; the homepage's job is a strong first
 * impression and a clear way in.
 *
 * Which eight: belts ticked "Featured" in the admin panel come first, in their
 * sort order. To choose the eight exactly, tick Featured on those and untick it
 * on the rest.
 *
 * One list serves both layouts: a swipeable rail on phones, a grid from `sm`.
 */
export default async function FeaturedBelts() {
  const [products, all] = await Promise.all([
    getFeaturedProducts(HOMEPAGE_BELTS),
    getShopProducts(),
  ]);
  const total = all.length;
  const shopAll = `/collections/${ALL_BELTS_SLUG}`;

  return (
    <section className="border-t border-line py-16 sm:py-20" aria-labelledby="featured-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Shop"
          title="Belts on the bench"
          titleId="featured-title"
          intro={
            products.length > 0
              ? `A few of the ${total} belts we build. Every one is made in-house.`
              : 'A rotating selection of builds ready to ship or reorder.'
          }
          action={
            products.length > 0 ? (
              <Link
                href={shopAll}
                className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-link transition-colors hover:text-link-hover"
              >
                Shop all {total} belts →
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
            {/* Phones: a rail that scrolls inside itself. sm and up: a grid. */}
            <div className="rail -mx-4 mt-12 flex gap-4 px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} railOnMobile priority={i < 2} />
              ))}
            </div>

            {total > products.length && (
              <div className="mt-10 flex justify-center">
                <Button href={shopAll} variant="secondary" size="lg">
                  Shop all {total} belts
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
