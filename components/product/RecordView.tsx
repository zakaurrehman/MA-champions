'use client';

import { useEffect } from 'react';
import { useRecentlyViewed } from '@/lib/recentlyViewed';

/**
 * Records a product view. Renders nothing.
 *
 * Kept as a separate island so the product page itself stays a server
 * component — the whole page does not need to ship to the client just to
 * write one string to localStorage.
 */
export default function RecordView({ slug }: { slug: string }) {
  const record = useRecentlyViewed((s) => s.record);

  useEffect(() => {
    record(slug);
  }, [slug, record]);

  return null;
}
