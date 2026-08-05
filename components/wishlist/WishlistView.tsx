'use client';

import { useMemo } from 'react';
import type { Product } from '@/lib/types';
import { useWishlist } from '@/lib/wishlist';
import { useHydrated } from '@/lib/useHydrated';
import ProductCard from '@/components/product/ProductCard';
import EmptyState from '@/components/ui/EmptyState';

export default function WishlistView({ products }: { products: Product[] }) {
  const slugs = useWishlist((s) => s.slugs);
  const clear = useWishlist((s) => s.clear);
  const hydrated = useHydrated();

  const items = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p));
  }, [slugs, products]);

  /* Saved items live in localStorage, so nothing is known until hydration.
     A skeleton avoids flashing "empty" at someone who has saved belts. */
  if (!hydrated) {
    return <div className="h-64" aria-busy="true" aria-label="Loading your wishlist" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing saved yet"
        body="Tap the heart on any belt to keep it here. Your wishlist is stored on this device — no account needed."
        ctaLabel="Browse collections"
        ctaHref="/collections"
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="font-body text-2xs uppercase tracking-[0.16em] text-subtle">
          {items.length} saved
        </p>
        <button
          type="button"
          onClick={clear}
          className="font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:text-link-hover"
        >
          Clear all
        </button>
      </div>

      <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
