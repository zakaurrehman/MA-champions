/**
 * Option vocabulary for the custom order form.
 *
 * Shared by the form and the API so the server validates against exactly the
 * list the customer was shown — a free-text spec would let anyone submit
 * "8mm platinum" and turn an order into a dispute.
 *
 * These are OUR builds, not a competitor's menu. We do not offer 8mm, so 8mm is
 * not on the list; advertising a thickness we may not be able to cut is how you
 * end up refunding a belt you already made.
 */

export interface OptionGroupDef {
  id: string;
  label: string;
  options: string[];
  /** Rendered as a "not sure" escape hatch — most customers genuinely aren't. */
  allowUnsure?: boolean;
}

export const UNSURE = 'Not sure — advise me';

export const CUSTOM_ORDER_GROUPS: OptionGroupDef[] = [
  {
    id: 'material',
    label: 'Plate material',
    options: ['Brass', 'Zinc (deep etched)', 'HD & CNC Premium'],
    allowUnsure: true,
  },
  {
    id: 'thickness',
    label: 'Plate thickness',
    options: ['2mm', '4mm', '6mm'],
    allowUnsure: true,
  },
  {
    id: 'plating',
    label: 'Plating / coating',
    options: ['24k Gold', 'Silver / Nickel', 'Dual gold + silver'],
    allowUnsure: true,
  },
  {
    id: 'stacking',
    label: 'Stacking',
    options: ['Single layer', 'Double layer', 'Triple layer', 'Quadruple layer'],
    allowUnsure: true,
  },
  {
    id: 'plates',
    label: 'Number of plates',
    options: ['1 (centre only)', '3 plates', '5 plates', '7 plates'],
    allowUnsure: true,
  },
  {
    id: 'strap',
    label: 'Strap size',
    options: ['Adult', 'Kids', 'Mini / display'],
    allowUnsure: true,
  },
];

/** Every value the server will accept for a group, including the escape hatch. */
export function allowedValues(group: OptionGroupDef): string[] {
  return group.allowUnsure ? [...group.options, UNSURE] : group.options;
}

/**
 * Validates a submitted selection and returns it as label/value pairs.
 *
 * Unknown groups and unknown values are dropped rather than rejected: a
 * half-recognised spec is still a lead worth having, and the free-text
 * instructions carry anything we did not model.
 */
export function describeSelection(raw: Record<string, string>): [string, string][] {
  const described: [string, string][] = [];

  for (const group of CUSTOM_ORDER_GROUPS) {
    const value = raw[group.id];
    if (!value) continue;
    if (!allowedValues(group).includes(value)) continue;
    described.push([group.label, value]);
  }

  return described;
}
