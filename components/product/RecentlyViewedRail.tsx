'use client';

import { useMemo } from 'react';
import type { Product } from '@/lib/types';
import { useRecentlyViewed } from '@/lib/recentlyViewed';
import { useHydrated } from '@/lib/useHydrated';
import ProductCard from './ProductCard';
import SectionHeading from '@/components/ui/SectionHeading';

interface Props {
  /** All shop products, passed from a server component. */
  products: Product[];
  /** Hide this slug — you are already looking at it. */
  excludeSlug?: string;
}

export default function RecentlyViewedRail({ products, excludeSlug }: Props) {
  const slugs = useRecentlyViewed((s) => s.slugs);
  const hydrated = useHydrated();

  const items = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return slugs
      .filter((s) => s !== excludeSlug)
      .map((s) => bySlug.get(s))
      .filter((p): p is Product => Boolean(p));
  }, [slugs, products, excludeSlug]);

  // Nothing to show, or not hydrated yet — render nothing rather than an
  // empty heading that pops in and shifts the page.
  if (!hydrated || items.length === 0) return null;

  return (
    <section aria-labelledby="recent-title" className="mt-16 border-t border-line pt-14">
      <SectionHeading eyebrow="Recently viewed" title="Pick up where you left off" titleId="recent-title" />
      <ul className="rail mt-10 flex gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {items.map((product) => (
          <li key={product.id} className="w-64 shrink-0 sm:w-auto">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
