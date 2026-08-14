/**
 * Pure formatting helpers. No data access, no server-only imports.
 *
 * This lives apart from lib/products.ts deliberately. That module is the data
 * boundary and now reaches the database, so it is marked server-only — pulling
 * a formatter out of it would drag that marker into the client bundle and
 * break the build. Formatting is not data access and does not belong there.
 */

export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    // Whole amounts read better without ".00" on a product grid.
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
