/**
 * Sitemap + robots.txt generation. Expanded in Phase 6.
 *
 * NOTE: siteUrl must match `site.url` in lib/site.ts. Both are still pointing
 * at a placeholder domain — see TODO-BEFORE-LAUNCH.md.
 */

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://machampionsbelts.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  // Private/transactional routes stay out of the index.
  exclude: ['/cart', '/wishlist', '/search', '/track-order', '/404'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/cart', '/wishlist', '/search', '/track-order'],
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
