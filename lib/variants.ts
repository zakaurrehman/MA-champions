/**
 * Variant options and live price computation.
 *
 * The pricing mechanism here is complete and correct. The modifier VALUES in
 * data/variants.json are all zero pending client confirmation, so the running
 * total currently equals the base price. `hasUnconfirmedModifiers()` lets the
 * UI say so rather than implying the shown total is final.
 */

import raw from '@/data/variants.json';

export interface VariantOption {
  id: string;
  label: string;
  hint?: string;
  swatch?: string;
  priceModifier: number;
}

export interface VariantGroup {
  id: string;
  label: string;
  required: boolean;
  confirmed: boolean;
  options: VariantOption[];
}

export interface EngravingConfig {
  label: string;
  maxLength: number;
  hint: string;
  priceModifier: number;
  confirmed: boolean;
}

/** Selected option id per group id, plus free-text engraving. */
export type VariantSelection = Record<string, string>;

export function getVariantGroups(): VariantGroup[] {
  return raw.groups as VariantGroup[];
}

export function getEngravingConfig(): EngravingConfig {
  return raw.engraving as EngravingConfig;
}

/** True while any modifier is still a placeholder zero. */
export function hasUnconfirmedModifiers(): boolean {
  const groups = getVariantGroups();
  return groups.some((g) => !g.confirmed) || !getEngravingConfig().confirmed;
}

/** Sensible starting selection: first option of each group. */
export function defaultSelection(): VariantSelection {
  const out: VariantSelection = {};
  for (const group of getVariantGroups()) {
    const first = group.options[0];
    if (first) out[group.id] = first.id;
  }
  return out;
}

/**
 * Base price plus every selected modifier, plus engraving if text was entered.
 * Never returns below zero.
 */
export function computePrice(
  basePrice: number,
  selection: VariantSelection,
  engravingText: string
): number {
  let total = basePrice;

  for (const group of getVariantGroups()) {
    const chosen = group.options.find((o) => o.id === selection[group.id]);
    if (chosen) total += chosen.priceModifier;
  }

  if (engravingText.trim().length > 0) total += getEngravingConfig().priceModifier;

  return Math.max(0, total);
}

/** Human-readable spec lines for cart entries, quotes and WhatsApp messages. */
export function describeSelection(
  selection: VariantSelection,
  engravingText: string
): string[] {
  const lines: string[] = [];

  for (const group of getVariantGroups()) {
    const chosen = group.options.find((o) => o.id === selection[group.id]);
    if (chosen) lines.push(`${group.label}: ${chosen.label}`);
  }

  if (engravingText.trim()) lines.push(`Engraving: "${engravingText.trim()}"`);

  return lines;
}
