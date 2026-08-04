'use client';

import { PRICE_BANDS, countActiveFilters, type Filters } from '@/lib/filters';
import { LEAGUE_COLLECTIONS } from '@/lib/tiers';
import { getVariantGroups } from '@/lib/variants';

interface Props {
  filters: Filters;
  onChange: (next: Filters) => void;
  onClear: () => void;
}

/** Ids match MaterialTierId in lib/types.ts and the ids in data/tiers.json. */
const MATERIALS = [
  { id: 'brass', label: 'Brass' },
  { id: 'boxing', label: 'Boxing' },
  { id: 'zinc', label: 'Zinc' },
  { id: '24k-gold', label: '24K Gold' },
  { id: 'hd-cnc-premium', label: 'HD & CNC' },
  { id: 'fully-custom', label: 'Fully Custom' },
] as const;

function CheckGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="border-b border-line pb-6">
      <legend className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
        {legend}
      </legend>
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => (
          <label key={opt.id} className="flex cursor-pointer items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={selected.includes(opt.id)}
              onChange={() => onToggle(opt.id)}
              className="h-4 w-4 shrink-0 accent-[--color-primary]"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function FilterSidebar({ filters, onChange, onClear }: Props) {
  const sizeGroup = getVariantGroups().find((g) => g.id === 'size');
  const active = countActiveFilters(filters);

  const toggle = (key: keyof Omit<Filters, 'inStockOnly'>, id: string) => {
    const list = filters[key];
    onChange({
      ...filters,
      [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
          Filter
        </h2>
        {active > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
          >
            Clear ({active})
          </button>
        )}
      </div>

      <CheckGroup
        legend="Material"
        options={MATERIALS.map((m) => ({ id: m.id, label: m.label }))}
        selected={filters.material}
        onToggle={(id) => toggle('material', id)}
      />

      <CheckGroup
        legend="Price"
        options={PRICE_BANDS.map((b) => ({ id: b.id, label: b.label }))}
        selected={filters.price}
        onToggle={(id) => toggle('price', id)}
      />

      <CheckGroup
        legend="Sport"
        options={LEAGUE_COLLECTIONS.map((l) => ({ id: l.id, label: l.name }))}
        selected={filters.league}
        onToggle={(id) => toggle('league', id)}
      />

      {sizeGroup && (
        <CheckGroup
          legend="Size"
          options={sizeGroup.options.map((o) => ({ id: o.id, label: o.label }))}
          selected={filters.size}
          onToggle={(id) => toggle('size', id)}
        />
      )}

      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })}
          className="h-4 w-4 shrink-0 accent-[--color-primary]"
        />
        In stock only
      </label>
    </div>
  );
}
