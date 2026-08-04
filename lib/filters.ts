/**
 * Collection filtering, sorting and pagination.
 *
 * Pure functions over a product array — no React, no URL parsing — so they are
 * trivially testable and reusable by search in Phase 5.
 */

import type { Product } from './types';

export const PRICE_BANDS = [
  { id: 'under-150', label: 'Under $150', min: 0, max: 150 },
  { id: '150-300', label: '$150 – $300', min: 150, max: 300 },
  { id: '300-500', label: '$300 – $500', min: 300, max: 500 },
  { id: 'over-500', label: '$500+', min: 500, max: Infinity },
] as const;

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'name-asc', label: 'Name: A–Z' },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]['id'];

export interface Filters {
  material: string[];
  league: string[];
  price: string[];
  size: string[];
  inStockOnly: boolean;
}

export const EMPTY_FILTERS: Filters = {
  material: [],
  league: [],
  price: [],
  size: [],
  inStockOnly: false,
};

const priceOf = (p: Product) => p.salePrice ?? p.price;

export function applyFilters(products: Product[], filters: Filters): Product[] {
  return products.filter((p) => {
    if (filters.material.length && !filters.material.includes(p.materialTier)) return false;

    if (filters.league.length && !filters.league.some((l) => p.collections.includes(l) || p.category === l))
      return false;

    if (filters.price.length) {
      const value = priceOf(p);
      const inBand = filters.price.some((bandId) => {
        const band = PRICE_BANDS.find((b) => b.id === bandId);
        return band ? value >= band.min && value < band.max : false;
      });
      if (!inBand) return false;
    }

    // Undefined availableSizes means every size is offered.
    if (filters.size.length && p.availableSizes && !filters.size.some((s) => p.availableSizes!.includes(s)))
      return false;

    if (filters.inStockOnly && !p.inStock) return false;

    return true;
  });
}

export function applySort(products: Product[], sort: SortId): Product[] {
  const out = products.slice();

  switch (sort) {
    case 'price-asc':
      return out.sort((a, b) => priceOf(a) - priceOf(b));
    case 'price-desc':
      return out.sort((a, b) => priceOf(b) - priceOf(a));
    case 'name-asc':
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case 'featured':
    default:
      return out.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

export interface Paged<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

export function paginate<T>(items: T[], page: number, perPage: number): Paged<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;

  return { items: items.slice(start, start + perPage), page: safePage, totalPages, total };
}

export function countActiveFilters(filters: Filters): number {
  return (
    filters.material.length +
    filters.league.length +
    filters.price.length +
    filters.size.length +
    (filters.inStockOnly ? 1 : 0)
  );
}
