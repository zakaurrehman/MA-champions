/**
 * Sitemap + robots.txt generation. Expanded in Phase 6.
 *
 * NOTE: siteUrl must match `site.url` in lib/site.ts. Both now point at the
 * live domain, and both read SITE_URL first so a preview deploy can override.
 */

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
     * Policy pages are NOT excluded. They should be indexed once approved, and
     * a sitemap exclusion here would be permanent. The draft state is handled
     * where it belongs — the page itself sets noindex until
     * site.policies.approved is true, so it corrects itself on approval.
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
    // Commercial pages carry more weight than policy pages.
    const priority = path === '/' ? 1.0 : path.startsWith('/policies') ? 0.3 : 0.7;
    return {
      loc: path,
      changefreq: path === '/' ? 'weekly' : 'monthly',
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};

