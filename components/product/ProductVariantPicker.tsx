'use client';

import type { ProductVariant } from '@/lib/types';
import { formatPrice } from '@/lib/format';

interface Props {
  label: string;
  variants: ProductVariant[];
  value: string | null;
  currency: string;
  onChange: (id: string) => void;
}

/**
 * Priced variant picker — plate thickness and similar.
 *
 * Each option shows its own price, so the customer can see what stepping up
 * costs before they select it rather than after. Real radio inputs, so arrow
 * keys work and the group announces its label.
 */
export default function ProductVariantPicker({
  label,
  variants,
  value,
  currency,
  onChange,
}: Props) {
  if (variants.length === 0) return null;

  return (
    <fieldset>
      <legend className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
        {label}
      </legend>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {variants.map((variant) => {
          const checked = variant.id === value;
          const id = `pv-${variant.id}`;

          return (
            <div key={variant.id}>
              <input
                type="radio"
                id={id}
                name="product-variant"
                value={variant.id}
                checked={checked}
                disabled={!variant.inStock}
                onChange={() => onChange(variant.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-[--radius-plate] border px-3 py-2.5 text-center transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:cursor-not-allowed peer-disabled:opacity-40 ${
                  checked ? 'border-primary bg-primary/5' : 'border-subtle/25 hover:border-subtle/60'
                }`}
              >
                <span
                  className={`font-body text-sm font-semibold leading-tight ${
                    checked ? 'text-link' : 'text-ink'
                  }`}
                >
                  {variant.name}
                </span>
                <span className="font-body text-2xs tabular-nums text-muted">
                  {variant.inStock ? formatPrice(variant.salePrice, currency) : 'Sold out'}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
