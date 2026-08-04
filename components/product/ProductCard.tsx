import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/products';
import StarRating from '@/components/ui/StarRating';

interface Props {
  product: Product;
  /** Rails need a fixed width; grids should stretch. */
  fixedWidth?: boolean;
  priority?: boolean;
}

/**
 * Shop product card. Second-image hover swap, strikethrough sale pricing and
 * rating are all driven by real data — a product with no reviews renders no
 * star row rather than a fake five stars.
 */
export default function ProductCard({ product, fixedWidth = false, priority = false }: Props) {
  const primary = product.images[0];
  const secondary = product.images[1];
  const onSale = product.salePrice !== null && product.salePrice < product.price;

  return (
    <article className={fixedWidth ? 'w-[78vw] max-w-[20rem] shrink-0 sm:w-72' : ''}>
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="border-plate relative aspect-[4/3] overflow-hidden rounded-[--radius-plate] bg-ink-raised">
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

          {onSale && (
            <span className="bg-plated absolute left-3 top-3 px-2 py-1 font-body text-2xs font-bold uppercase tracking-wider text-ink">
              Sale
            </span>
          )}
        </div>

        <div className="pt-4">
          <h3 className="font-body text-sm font-semibold leading-snug text-bone transition-colors group-hover:text-gold-hi">
            {product.name}
          </h3>

          {product.rating !== null && product.reviewCount > 0 && (
            <div className="mt-2">
              <StarRating rating={product.rating} count={product.reviewCount} />
            </div>
          )}

          <p className="mt-2.5 flex items-baseline gap-2">
            {onSale && (
              <span className="text-sm text-nickel line-through">
                {formatPrice(product.price, product.currency)}
              </span>
            )}
            <span className="font-display text-lg text-plated">
              {formatPrice(product.salePrice ?? product.price, product.currency)}
            </span>
          </p>
        </div>
      </Link>
    </article>
  );
}
