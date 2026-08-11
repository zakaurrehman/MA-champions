import { formatPrice } from '@/lib/products';
import type { ResolvedPrice } from '@/lib/pricing';

interface Props {
  price: ResolvedPrice;
  size?: 'sm' | 'md' | 'lg';
  /** Show the "-13%" chip beside the price. */
  showBadge?: boolean;
  className?: string;
}

const CURRENT = {
  sm: 'font-display text-lg',
  md: 'font-display text-2xl',
  lg: 'font-display text-4xl',
} as const;

const WAS = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const;

/**
 * The only place a price is rendered.
 *
 * The compare-at price appears ONLY when `original` is genuinely higher —
 * lib/pricing.ts returns null otherwise. A struck-through price the belt never
 * actually sold at is a false discount claim, so the component is built so
 * that it cannot be shown by accident.
 */
export default function PriceDisplay({
  price,
  size = 'md',
  showBadge = true,
  className = '',
}: Props) {
  const { current, original, discountPercent, currency } = price;

  return (
    <p className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-1 ${className}`}>
      {original !== null && discountPercent !== null && (
        <span className={`${WAS[size]} text-subtle line-through`}>
          {formatPrice(original, currency)}
        </span>
      )}

      <span className={`${CURRENT[size]} text-plated`}>{formatPrice(current, currency)}</span>

      {showBadge && discountPercent !== null && (
        <span className="rounded-[--radius-plate] bg-primary px-2 py-0.5 font-body text-2xs font-bold uppercase tracking-wider text-on-primary">
          {discountPercent}% off
        </span>
      )}
    </p>
  );
}
