import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { resolvePrice } from '@/lib/pricing';
import StarRating from '@/components/ui/StarRating';
import WishlistButton from './WishlistButton';
import ProductCardActions from './ProductCardActions';
import PriceDisplay from './PriceDisplay';

interface Props {
  product: Product;
  /** Rails need a fixed width; grids should stretch. */
  fixedWidth?: boolean;
  priority?: boolean;
  /** Rails hide the buy controls to keep the card compact. */
  compact?: boolean;
}

/**
 * Shop product card.
 *
 * Rating, pricing and discount are all driven by real data — a product with no
 * reviews renders "No reviews yet" rather than a fake five stars, and the
 * discount badge only appears when lib/pricing.ts finds a genuine saving.
 */
export default function ProductCard({
  product,
  fixedWidth = false,
  priority = false,
  compact = false,
}: Props) {
  const primary = product.images[0];
  const secondary = product.images[1];
  const price = resolvePrice(product);

  return (
    <article
      className={`relative ${fixedWidth ? 'w-[78vw] max-w-[20rem] shrink-0 sm:w-72' : ''}`}
    >
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

          <div className="mt-2">
            {product.rating !== null && product.reviewCount > 0 ? (
              <StarRating rating={product.rating} count={product.reviewCount} />
            ) : (
              <span className="font-body text-2xs uppercase tracking-[0.14em] text-subtle">
                No reviews yet
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Outside the Link: buttons inside an <a> are invalid HTML and every
          click would navigate instead of acting. Compact rails show price only;
          the whole card is already a link to the product. */}
      {compact ? (
        <PriceDisplay price={price} size="sm" className="mt-3" />
      ) : (
        <ProductCardActions product={product} />
      )}
    </article>
  );
}
