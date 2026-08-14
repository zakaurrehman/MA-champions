import 'server-only';
import { revalidatePath } from 'next/cache';

/**
 * Clears the cached storefront after a catalogue change.
 *
 * Every page that lists products is statically rendered, so without this an
 * admin edit — including a delete — never reaches the site until the next
 * deploy. The pages also carry a time-based `revalidate` as a safety net, but
 * waiting five minutes to see your own change is not an acceptable admin
 * experience, and a deleted product staying purchasable is worse than slow.
 *
 * Passing the dynamic route pattern with 'page' revalidates every instance of
 * that route, not just one — so all collections and all product pages clear.
 */
export function revalidateCatalogue(): void {
  const paths: [string, 'page' | 'layout'][] = [
    ['/', 'page'],
    ['/collections', 'page'],
    ['/collections/[slug]', 'page'],
    ['/products/[slug]', 'page'],
    ['/custom', 'page'],
    ['/search', 'page'],
    ['/wishlist', 'page'],
    ['/pricing', 'page'],
    ['/sitemap.xml', 'page'],
  ];

  for (const [path, type] of paths) {
    try {
      revalidatePath(path, type);
    } catch {
      // Never let a cache miss fail the write that already succeeded.
    }
  }
}
