'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { searchProducts, SEARCH_SUGGESTIONS } from '@/lib/search';
import ProductCard from '@/components/product/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import { SearchIcon } from '@/components/ui/Icons';

export default function SearchView({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');

  const hits = useMemo(() => searchProducts(products, query), [products, query]);
  const searching = query.trim().length >= 2;

  return (
    <div>
      <div className="relative max-w-xl">
        <SearchIcon
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
        <label htmlFor="site-search" className="sr-only">
          Search belts
        </label>
        <input
          id="site-search"
          type="search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search championship belts…"
          className="w-full rounded-[--radius-plate] border border-subtle/30 bg-surface py-4 pl-12 pr-4 font-body text-base text-ink placeholder:text-subtle/70 focus:border-primary focus:outline-none"
        />
      </div>

      {!searching && (
        <div className="mt-6">
          <p className="font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Try
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SEARCH_SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setQuery(s)}
                  className="rounded-[--radius-plate] border border-subtle/30 px-3.5 py-2 font-body text-2xs uppercase tracking-[0.12em] text-muted transition-colors hover:border-primary hover:text-link"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10" aria-live="polite">
        {searching && (
          <p className="mb-6 font-body text-2xs uppercase tracking-[0.16em] text-subtle">
            {hits.length} {hits.length === 1 ? 'result' : 'results'} for “{query.trim()}”
          </p>
        )}

        {searching && hits.length === 0 && (
          <EmptyState
            title="Nothing matched"
            body={
              products.length === 0
                ? 'There are no belts in the shop yet, so there is nothing to search. Use the Belt Builder to spec exactly what you want.'
                : 'Try a shorter search, or browse the collections instead.'
            }
            ctaLabel="Build your belt"
            ctaHref="/build"
          />
        )}

        {hits.length > 0 && (
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {hits.map(({ product }) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
