/**
 * Sitemap + robots.txt generation.
 *
 * NOTE: siteUrl must match `site.url` in lib/site.ts. Both read SITE_URL first
 * so a preview deploy can override, and both fall back to the live domain. If
 * you build locally with SITE_URL=http://localhost:3000 in .env.local, the
 * generated public/sitemap.xml will carry localhost URLs — that file is
 * git-ignored and regenerated on every deploy, so it never ships.
 */

/**
 * Per-page priority and changefreq, hand-tuned from the SEO team's sitemap spec.
 *
 * Worth being straight about impact: Google has said repeatedly that it ignores
 * <priority> and <changefreq> and reads only <lastmod>. Bing and some smaller
 * crawlers still use them. This map exists mainly so the live sitemap matches
 * the spec document, and it costs nothing to carry.
 *
 * Pages NOT listed here (product pages, blog posts, policy pages) still appear
 * in the sitemap via the fallback in `transform` — the spec just did not
 * enumerate 80 product URLs by hand.
 */
const PAGE_RULES = {
  '/': { priority: 1.0, changefreq: 'daily' },
  '/build': { priority: 0.95, changefreq: 'weekly' },
  '/blog': { priority: 0.9, changefreq: 'daily' },
  '/about': { priority: 0.8, changefreq: 'monthly' },
  '/pricing': { priority: 0.8, changefreq: 'monthly' },
  '/reviews': { priority: 0.8, changefreq: 'weekly' },
  '/faqs': { priority: 0.75, changefreq: 'monthly' },
  '/contact': { priority: 0.75, changefreq: 'monthly' },

  /*
   * Not in the SEO spec's 24 rows, but a real commercial page — the custom-work
   * showcase, linked as "Custom Work" in the footer. Weighted with the top
   * collections rather than left on the 0.6 fallback. Adjust if the SEO team
   * wants it lower.
   */
  '/custom': { priority: 0.9, changefreq: 'weekly' },

  '/collections/all-championship-belts': { priority: 0.95, changefreq: 'weekly' },
  '/collections/custom-championship-belts': { priority: 0.9, changefreq: 'weekly' },
  '/collections/wrestling-championship-belts': { priority: 0.9, changefreq: 'weekly' },

  '/collections/boxing-championship-belts': { priority: 0.85, changefreq: 'weekly' },
  '/collections/mma-championship-belts': { priority: 0.85, changefreq: 'weekly' },
  '/collections/football-championship-belts': { priority: 0.85, changefreq: 'weekly' },
  '/collections/basketball-championship-belts': { priority: 0.85, changefreq: 'weekly' },
  '/collections/baseball-championship-belts': { priority: 0.85, changefreq: 'weekly' },
  '/collections/hockey-championship-belts': { priority: 0.85, changefreq: 'weekly' },
  '/collections/fantasy-league-belts': { priority: 0.85, changefreq: 'weekly' },

  '/collections/brass-championship-belts': { priority: 0.8, changefreq: 'monthly' },
  '/collections/zinc-championship-belts': { priority: 0.8, changefreq: 'monthly' },
  '/collections/24k-gold-championship-belts': { priority: 0.8, changefreq: 'monthly' },
  '/collections/hd-cnc-championship-belts': { priority: 0.8, changefreq: 'monthly' },
};

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.mawrestlingbelts.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  // Private/transactional routes stay out of the index.
  exclude: [
    '/cart',
    '/wishlist',
    '/search',
    '/track-order',
    '/404',
    '/admin',
    '/admin/*',
    // Per-customer, so nothing here is meaningful to a crawler.
    '/account',
    /*
     * Image-generation routes, not pages. next-sitemap picks them up from the
     * app directory; they have no business in a sitemap and Search Console
     * flags them as "Crawled - not indexed".
     */
    '/icon',
    '/opengraph-image',
    /*
     * Carries an order reference and an access token in the query string.
     * The page sets noindex too; this keeps it out of the sitemap as well so
     * a URL from a shared link never becomes a crawlable page.
     */
    '/order-confirmation',
    '/reset-password',
    /*
     * Policy pages are NOT excluded. They should be indexed once approved, and
     * a sitemap exclusion here would be permanent. The draft state is handled
     * where it belongs — the page itself sets noindex until
     * site.policies.approved is true, so it corrects itself on approval.
     *
     * NOTE: the SEO spec lists /track-order at priority 0.75. It is kept OUT
     * here on purpose: it is a thin form page with nothing unique to index, it
     * is disallowed in robots.txt below, and putting it in the sitemap while
     * robots blocks it sends Google contradictory signals. To follow the spec
     * literally, remove it from this array AND from the robots `disallow`
     * list, and add a rule for it in PAGE_RULES.
     */
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        // /admin is token-gated, but there is no reason to advertise it.
        disallow: ['/cart', '/wishlist', '/search', '/track-order', '/admin', '/account'],
      },
    ],
  },
  transform: async (config, path) => {
    const rule =
      PAGE_RULES[path] ??
      // Fallbacks for pages the spec did not list by name.
      (path.startsWith('/products/')
        ? { priority: 0.8, changefreq: 'weekly' } // conversion pages — high, just under the top collections
        : path.startsWith('/blog/')
          ? { priority: 0.7, changefreq: 'monthly' } // individual posts
          : path.startsWith('/policies')
            ? { priority: 0.3, changefreq: 'yearly' } // legal boilerplate, rarely changes
            : { priority: 0.6, changefreq: 'monthly' }); // anything else (e.g. /collections index)

    return {
      loc: path,
      changefreq: rule.changefreq,
      priority: rule.priority,
      // Build time, i.e. last deploy. Real per-page dates (product updated_at,
      // post published date) would be better but next-sitemap's transform has
      // no access to that data without a parallel fetch.
      lastmod: new Date().toISOString(),
    };
  },
};
