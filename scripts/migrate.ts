/**
 * Creates every table and seeds products from data/products.json.
 *
 *   npm run migrate
 *
 * Safe to run repeatedly. Tables are IF NOT EXISTS and the product seed is an
 * upsert on slug, so re-running syncs the JSON in without duplicating rows or
 * destroying admin edits to products that are not in the JSON.
 */

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { ensureAllTables } from '../lib/db-schema.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  console.error('Put it in .env.local, then: npm run migrate');
  process.exit(1);
}

const sql = neon(url);

console.log('Creating tables…');
await ensureAllTables(sql);
console.log('  tables ready');

/* ---- seed products ---- */

const raw = JSON.parse(readFileSync('data/products.json', 'utf8')) as {
  products: Record<string, unknown>[];
};

console.log(`\nSeeding ${raw.products.length} products…`);

let inserted = 0;
let updated = 0;

for (const [index, p] of raw.products.entries()) {
  const visibility = (p.visibility ?? {}) as Record<string, boolean>;

  const existing = (await sql`
    SELECT id FROM products WHERE slug = ${p.slug as string}
  `) as unknown as { id: number }[];

  await sql`
    INSERT INTO products (
      slug, name, category, collections, material_tier,
      price, original_price, sale_price, currency,
      in_stock, featured, shop_visible, custom_gallery,
      short_description, description,
      variant_label, specs, variants, images, sort_order
    ) VALUES (
      ${p.slug as string},
      ${p.name as string},
      ${(p.category as string) ?? 'wrestling'},
      ${(p.collections as string[]) ?? []},
      ${(p.materialTier as string) ?? 'hd-cnc-premium'},
      ${p.price as number},
      ${(p.originalPrice as number) ?? null},
      ${(p.salePrice as number) ?? null},
      ${(p.currency as string) ?? 'USD'},
      ${(p.inStock as boolean) ?? true},
      ${(p.featured as boolean) ?? false},
      ${visibility.shop ?? true},
      ${visibility.customGallery ?? false},
      ${(p.shortDescription as string) ?? ''},
      ${(p.description as string) ?? ''},
      ${(p.variantLabel as string) ?? null},
      ${JSON.stringify(p.specs ?? {})},
      ${JSON.stringify(p.variants ?? [])},
      ${JSON.stringify(p.images ?? [])},
      ${index}
    )
    ON CONFLICT (slug) DO UPDATE SET
      name              = EXCLUDED.name,
      category          = EXCLUDED.category,
      collections       = EXCLUDED.collections,
      material_tier     = EXCLUDED.material_tier,
      price             = EXCLUDED.price,
      original_price    = EXCLUDED.original_price,
      sale_price        = EXCLUDED.sale_price,
      currency          = EXCLUDED.currency,
      in_stock          = EXCLUDED.in_stock,
      featured          = EXCLUDED.featured,
      shop_visible      = EXCLUDED.shop_visible,
      custom_gallery    = EXCLUDED.custom_gallery,
      short_description = EXCLUDED.short_description,
      description       = EXCLUDED.description,
      variant_label     = EXCLUDED.variant_label,
      specs             = EXCLUDED.specs,
      variants          = EXCLUDED.variants,
      images            = EXCLUDED.images,
      updated_at        = NOW()
  `;

  if (existing.length > 0) updated++;
  else inserted++;
}

const counts = (await sql`
  SELECT
    (SELECT COUNT(*)::int FROM products) AS products,
    (SELECT COUNT(*)::int FROM products WHERE shop_visible) AS visible,
    (SELECT COUNT(*)::int FROM reviews) AS reviews
`) as unknown as { products: number; visible: number; reviews: number }[];

console.log(`  inserted ${inserted}, updated ${updated}`);
console.log('');
console.log('Done.');
console.log(`  products: ${counts[0]?.products} (${counts[0]?.visible} visible in shop)`);
console.log(`  reviews:  ${counts[0]?.reviews}`);
