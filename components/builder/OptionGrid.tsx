'use client';

interface Item<T> {
  id: T;
  name: string;
  blurb?: string;
  swatch?: string;
}

interface Props<T extends string | number> {
  legend: string;
  name: string;
  items: Item<T>[];
  value: T;
  onChange: (id: T) => void;
  columns?: 2 | 3;
}

/**
 * Radio group rendered as selectable cards.
 *
 * Real <input type="radio"> under the surface, so arrow keys move between
 * options, the group is announced with its legend, and the whole thing works
 * without JavaScript-driven focus management.
 */
export default function OptionGrid<T extends string | number>({
  legend,
  name,
  items,
  value,
  onChange,
  columns = 2,
}: Props<T>) {
  return (
    <fieldset>
      <legend className="mb-4 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
        {legend}
      </legend>

      <div className={`grid gap-3 ${columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {items.map((item) => {
          const checked = item.id === value;
          const id = `${name}-${item.id}`;

          return (
            <div key={String(item.id)}>
              <input
                type="radio"
                id={id}
                name={name}
                checked={checked}
                onChange={() => onChange(item.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={`flex h-full cursor-pointer items-start gap-3 rounded-[--radius-plate] border p-4 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[--color-focus] ${
                  checked
                    ? 'border-primary bg-primary/5'
                    : 'border-subtle/25 hover:border-subtle/60'
                }`}
              >
                {item.swatch && (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 h-7 w-7 shrink-0 rounded-full border border-subtle/40"
                    style={{
                      backgroundColor:
                        item.swatch === 'transparent' ? undefined : item.swatch,
                      backgroundImage:
                        item.swatch === 'transparent'
                          ? 'repeating-linear-gradient(45deg, var(--color-line) 0 4px, transparent 4px 8px)'
                          : undefined,
                    }}
                  />
                )}
                <span className="min-w-0">
                  <span
                    className={`block font-body text-sm font-semibold leading-tight ${
                      checked ? 'text-link' : 'text-ink'
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.blurb && (
                    <span className="mt-1 block text-2xs leading-snug text-muted">
                      {item.blurb}
                    </span>
                  )}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
