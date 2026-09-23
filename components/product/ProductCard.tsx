import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { getVariants, priceRange, resolvePrice } from '@/lib/pricing';
import { formatPrice } from '@/lib/format';
import StarRating from '@/components/ui/StarRating';
import WishlistButton from './WishlistButton';
import PriceDisplay from './PriceDisplay';

interface Props {
  product: Product;
  /** Rails need a fixed width; grids should stretch. */
  fixedWidth?: boolean;
  /**
   * A horizontal rail on phones, a normal grid cell from `sm` up. Lets one list
   * serve both layouts, so the homepage no longer renders every card twice.
   */
  railOnMobile?: boolean;
  priority?: boolean;
}

/**
 * Shop product card.
 *
 * Deliberately simple: photo, name, price, and stars only when there are
 * reviews. The whole card is one link.
 *
 * It used to carry build chips, a quantity stepper, "Add to cart" and "View
 * more" on every card. That made grids tall and noisy, and it duplicated the
 * product page — where a customer has to go anyway to choose leather colour,
 * strap size and engraving before a belt can be made.
 *
 * "No reviews yet" is no longer printed. Repeated on every card it read as
 * "nobody buys here"; an absent rating says nothing, which is honest.
 *
 * Rating, pricing and discount are all driven by real data, and the discount
 * badge only appears when lib/pricing.ts finds a genuine saving.
 */
export default function ProductCard({
  product,
  fixedWidth = false,
  railOnMobile = false,
  priority = false,
}: Props) {
  const primary = product.images[0];
  const secondary = product.images[1];
  const price = resolvePrice(product);
  const builds = getVariants(product).length;
  const range = priceRange(product);

  const width = fixedWidth
    ? 'w-[78vw] max-w-[20rem] shrink-0 sm:w-72'
    : railOnMobile
      ? 'w-[78vw] max-w-[20rem] shrink-0 sm:w-auto sm:max-w-none'
      : '';

  return (
    <article className={`relative ${width}`}>
      {/* Sibling of the Link, not a child: a <button> inside an <a> is invalid
          HTML and the click would navigate instead of saving. */}
      <WishlistButton slug={product.slug} name={product.name} />

      <Link href={`/products/${product.slug}`} className="group block">
        <div className="border-plate relative aspect-[4/3] overflow-hidden rounded-[--radius-plate] bg-surface">
          {primary && (
            <Image
              src={primary.src}
              alt={primary.alt}
              fill
              priority={priority}
              placeholder={primary.blurDataURL ? 'blur' : 'empty'}
              blurDataURL={primary.blurDataURL}
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 33vw, 22vw"
              className={`object-cover transition-opacity duration-500 ${
                secondary ? 'group-hover:opacity-0' : ''
              }`}
            />
          )}
          {secondary && (
            <Image
              src={secondary.src}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 640px) 78vw, (max-width: 1024px) 33vw, 22vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}

          {/* Only ever shown for a real saving — see lib/pricing.ts. */}
          {price.discountPercent !== null && (
            <span className="absolute left-3 top-3 rounded-[--radius-plate] bg-primary px-2 py-1 font-body text-2xs font-bold uppercase tracking-wider text-on-primary">
              −{price.discountPercent}%
            </span>
          )}
        </div>

        <div className="pt-4">
          <h3 className="font-body text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-link-hover">
            {product.name}
          </h3>

          {product.rating !== null && product.reviewCount > 0 && (
            <div className="mt-2">
              <StarRating rating={product.rating} count={product.reviewCount} />
            </div>
          )}

          {/* The headline price is the build the photos show (the product's
              default), so it matches the page the customer lands on. The line
              under it says there are cheaper builds without changing that. */}
          <PriceDisplay price={price} size="sm" showBadge={false} className="mt-2.5" />
          {builds > 1 && range && (
            <p className="mt-1 text-xs text-muted">
              {builds} builds from {formatPrice(range.min, price.currency)}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
