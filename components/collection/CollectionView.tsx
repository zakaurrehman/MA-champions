'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import {
  EMPTY_FILTERS,
  applyFilters,
  applySort,
  countActiveFilters,
  paginate,
  SORT_OPTIONS,
  type Filters,
  type SortId,
} from '@/lib/filters';
import ProductCard from '@/components/product/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import FilterSidebar from './FilterSidebar';
import Pagination from './Pagination';
import { CloseIcon } from '@/components/ui/Icons';

const PER_PAGE = 12;

/**
 * Filter/sort/pagination for a collection.
 *
 * IMPORTANT: this deliberately does NOT use `useSearchParams`. Reading it
 * during render opts the whole route out of static prerendering, which shipped
 * collection pages with zero product links in the HTML — invisible to crawlers
 * and terrible for LCP.
 *
 * Instead the first render is always the unfiltered page 1, so the server
 * prerenders real products. URL state is read on mount and on popstate, and
 * written back with history.replaceState so filters stay shareable and the
 * back button still works.
 */

function parseSearch(search: string): { filters: Filters; sort: SortId; page: number } {
  const sp = new URLSearchParams(search);
  const list = (k: string) => sp.get(k)?.split(',').filter(Boolean) ?? [];

  return {
    filters: {
      material: list('material'),
      league: list('league'),
      price: list('price'),
      size: list('size'),
      inStockOnly: sp.get('stock') === 'in',
    },
    sort: (sp.get('sort') as SortId) || 'featured',
    page: Number(sp.get('page')) || 1,
  };
}

function toSearch(filters: Filters, sort: SortId, page: number): string {
  const sp = new URLSearchParams();
  if (filters.material.length) sp.set('material', filters.material.join(','));
  if (filters.league.length) sp.set('league', filters.league.join(','));
  if (filters.price.length) sp.set('price', filters.price.join(','));
  if (filters.size.length) sp.set('size', filters.size.join(','));
  if (filters.inStockOnly) sp.set('stock', 'in');
  if (sort !== 'featured') sp.set('sort', sort);
  if (page > 1) sp.set('page', String(page));
  return sp.toString();
}

export default function CollectionView({ products }: { products: Product[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortId>('featured');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* Adopt URL state after hydration, and follow back/forward navigation. */
  useEffect(() => {
    const sync = () => {
      const next = parseSearch(window.location.search);
      setFilters(next.filters);
      setSort(next.sort);
      setPage(next.page);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const commit = useCallback((nextFilters: Filters, nextSort: SortId, nextPage: number) => {
    setFilters(nextFilters);
    setSort(nextSort);
    setPage(nextPage);

    const qs = toSearch(nextFilters, nextSort, nextPage);
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, []);

  const result = useMemo(() => {
    const filtered = applyFilters(products, filters);
    const sorted = applySort(filtered, sort);
    return paginate(sorted, page, PER_PAGE);
  }, [products, filters, sort, page]);

  const activeCount = countActiveFilters(filters);

  const sidebar = (
    <FilterSidebar
      filters={filters}
      onChange={(next) => commit(next, sort, 1)}
      onClear={() => commit(EMPTY_FILTERS, sort, 1)}
    />
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-12">
      <aside className="hidden lg:block">{sidebar}</aside>

      <div>
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-ink-line pb-5">
          <p className="text-sm text-bone-dim">
            {result.total} {result.total === 1 ? 'belt' : 'belts'}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="border-plate rounded-[--radius-plate] px-4 py-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-bone hover:border-gold hover:text-gold lg:hidden"
            >
              Filter{activeCount > 0 && ` (${activeCount})`}
            </button>

            <label className="flex items-center gap-2">
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => commit(filters, e.target.value as SortId, 1)}
                className="rounded-[--radius-plate] border border-nickel/25 bg-ink px-3 py-2 font-body text-xs text-bone focus:border-gold focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {result.items.length === 0 ? (
          <EmptyState
            title={activeCount > 0 ? 'No belts match those filters' : 'Nothing listed here yet'}
            body={
              activeCount > 0
                ? 'Try clearing a filter or two. Every belt we make can also be built to order.'
                : 'We are photographing this range now. Every belt in it can still be built to order — spec yours and we will quote it.'
            }
          />
        ) : (
          <>
            <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPage={(next) => commit(filters, sort, next)}
            />
          </>
        )}
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-ink-line bg-ink"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-line px-5">
              <span className="font-display text-sm uppercase tracking-wide text-bone">
                Filters
              </span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="grid h-10 w-10 place-items-center text-bone hover:text-gold"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{sidebar}</div>
          </div>
        </div>
      )}
    </div>
  );
}
