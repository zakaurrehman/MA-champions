'use client';

import type { VariantGroup } from '@/lib/variants';

interface Props {
  group: VariantGroup;
  value: string;
  onChange: (optionId: string) => void;
}

/**
 * One variant group as a radio set. Uses real radio inputs so keyboard and
 * screen-reader behaviour is native — arrow keys move between options and the
 * group announces its label.
 */
export default function VariantSelector({ group, value, onChange }: Props) {
  const isSwatch = group.options.some((o) => o.swatch);

  return (
    <fieldset>
      <legend className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
        {group.label}
      </legend>

      <div className={isSwatch ? 'flex flex-wrap gap-2.5' : 'grid grid-cols-2 gap-2.5'}>
        {group.options.map((option) => {
          const checked = option.id === value;
          const id = `${group.id}-${option.id}`;

          return (
            <div key={option.id} className="relative">
              <input
                type="radio"
                id={id}
                name={group.id}
                value={option.id}
                checked={checked}
                onChange={() => onChange(option.id)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={`flex cursor-pointer items-center gap-3 rounded-[--radius-plate] border px-3.5 py-3 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ${
                  checked
                    ? 'border-primary bg-primary/5'
                    : 'border-subtle/25 hover:border-subtle/60'
                }`}
              >
                {option.swatch && (
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 rounded-full border border-subtle/40"
                    style={{ backgroundColor: option.swatch }}
                  />
                )}
                <span className="min-w-0">
                  <span
                    className={`block font-body text-sm font-semibold leading-tight ${
                      checked ? 'text-link' : 'text-ink'
                    }`}
                  >
                    {option.label}
                  </span>
                  {option.hint && !isSwatch && (
                    <span className="mt-0.5 block text-2xs leading-snug text-muted">
                      {option.hint}
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
