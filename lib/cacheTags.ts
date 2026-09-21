/**
 * Cache tags, in one dependency-free file so the reader (lib/products.ts) and
 * the invalidator (lib/revalidate.ts) can share a constant without importing
 * each other.
 */

/** The whole product catalogue as read from the database. */
export const PRODUCTS_CACHE_TAG = 'products';
