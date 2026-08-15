'use client';

import type { ProductVariant } from '@/lib/types';
import { STANDARD_BUILD_LADDER, newVariantId } from '@/lib/buildLadder';
import { formatPrice } from '@/lib/format';
import { discountPercent } from '@/lib/pricing';

const field =
  'w-full rounded-[--radius-plate] border border-subtle/25 bg-canvas px-3 py-2 font-body text-sm text-ink placeholder:text-subtle/60 focus:border-primary focus:outline-none';
const label =
  'mb-1 block font-body text-2xs font-semibold uppercase tracking-[0.16em] text-subtle';

interface Props {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

/**
 * Per-build pricing — the 2mm Brass / 4mm Standard / 4mm CNC / 6mm CNC ladder
 * the customer picks from on the product page.
 *
 * When a belt has builds, THEY are the price. The product-level price becomes
 * a fallback for anywhere a build has not been chosen, which is why the
 * customer cannot add a build-priced belt to the cart without selecting one.
 */
export default function VariantEditor({ variants, onChange }: Props) {
  const update = (index: number, patch: Partial<ProductVariant>) => {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  /** Exactly one default, so the product page always has a build to lead with. */
  const setDefault = (index: number) => {
    onChange(variants.map((v, i) => ({ ...v, isDefault: i === index })));
  };

  const remove = (index: number) => {
    const next = variants.filter((_, i) => i !== index);
    // Removing the default would leave none. Promote the first survivor.
    if (next.length > 0 && !next.some((v) => v.isDefault)) next[0]!.isDefault = true;
    onChange(next);
  };

  const addBlank = () => {
    onChange([
      ...variants,
      {
        id: newVariantId(),
        name: '',
        salePrice: 0,
        originalPrice: null,
        stock: null,
        inStock: true,
        isDefault: variants.length === 0,
      },
    ]);
  };

  if (variants.length === 0) {
    return (
      <div className="rounded-[--radius-plate] border border-dashed border-subtle/30 p-6 text-center">
        <p className="font-body text-sm font-semibold text-ink">No builds priced yet</p>
        <p className="mx-auto mt-2 max-w-md text-2xs leading-relaxed text-muted">
          Without builds this belt sells at the single price above. Add the ladder to charge a
          different price for each plate thickness, the way the rest of the catalogue does.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => onChange(STANDARD_BUILD_LADDER.map((v) => ({ ...v })))}
            className="rounded-[--radius-plate] bg-primary px-5 py-2.5 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-on-primary hover:bg-primary-hover"
          >
            Add the standard 4 builds
          </button>
          <button
            type="button"
            onClick={addBlank}
            className="rounded-[--radius-plate] border border-subtle/40 px-5 py-2.5 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink hover:border-primary hover:text-link"
          >
            Add one build
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {variants.map((variant, i) => {
        const off = discountPercent(variant.originalPrice, variant.salePrice);

        return (
          <div key={variant.id} className="rounded-[--radius-plate] border border-line p-4">
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
              <div>
                <label htmlFor={`v-name-${variant.id}`} className={label}>
                  Build name
                </label>
                <input
                  id={`v-name-${variant.id}`}
                  value={variant.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="6mm CNC"
                  className={field}
                />
              </div>

              <div>
                <label htmlFor={`v-price-${variant.id}`} className={label}>
                  Price charged
                </label>
                <input
                  id={`v-price-${variant.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={variant.salePrice || ''}
                  onChange={(e) => update(i, { salePrice: Number(e.target.value) || 0 })}
                  className={field}
                />
              </div>

              <div>
                <label htmlFor={`v-was-${variant.id}`} className={label}>
                  Compare-at
                </label>
                <input
                  id={`v-was-${variant.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={variant.originalPrice ?? ''}
                  onChange={(e) =>
                    update(i, {
                      originalPrice: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  placeholder="Optional"
                  className={field}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <label className="flex cursor-pointer items-center gap-2 font-body text-2xs text-ink">
                <input
                  type="radio"
                  name="variant-default"
                  checked={variant.isDefault === true}
                  onChange={() => setDefault(i)}
                  className="h-3.5 w-3.5 accent-[--color-primary]"
                />
                Shown first
              </label>

              <label className="flex cursor-pointer items-center gap-2 font-body text-2xs text-ink">
                <input
                  type="checkbox"
                  checked={variant.inStock}
                  onChange={() => update(i, { inStock: !variant.inStock })}
                  className="h-3.5 w-3.5 accent-[--color-primary]"
                />
                In stock
              </label>

              <span className="font-body text-2xs text-muted">
                Customer sees{' '}
                <span className="text-ink">{formatPrice(variant.salePrice)}</span>
                {off !== null && <span className="text-link"> · {off}% off</span>}
              </span>

              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-auto font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addBlank}
          className="rounded-[--radius-plate] border border-subtle/40 px-5 py-2.5 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-ink hover:border-primary hover:text-link"
        >
          Add another build
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className="font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle hover:text-link"
        >
          Remove all builds
        </button>
      </div>

      <p className="text-2xs leading-relaxed text-muted">
        These prices override the single price above. Only fill in compare-at for a build that
        genuinely sold at that price — a “was” price you never charged is a false discount claim.
      </p>
    </div>
  );
}
