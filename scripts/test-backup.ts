/**
 * Backup / restore round-trip test.
 *
 * Run: npm run test:backup
 *
 * Runs against an in-memory Postgres (PGlite), so it needs no network, no Neon
 * account and — importantly — works while the real database is unreachable.
 *
 * It exists because a backup nobody has restored is a guess. The scenario is the
 * real one: build a shop's worth of data, back it up, load it into a completely
 * empty second database, and check nothing was lost, mangled or duplicated.
 */

import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { ensureAllTables } from '../lib/db-schema.ts';
import { asSqlTag, exportBackup, restoreBackup, serialiseBackup } from './lib/backup.ts';
import type { BackupFile, Db } from './lib/backup.ts';

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log(`  PASS  ${name}`);
}

async function memoryDb(): Promise<Db> {
  const pg = new PGlite();
  await pg.waitReady;
  return {
    query: async (text, params) =>
      (await pg.query(text, params as unknown[] | undefined)).rows as Record<string, unknown>[],
  };
}

async function freshShop(): Promise<Db> {
  const db = await memoryDb();
  await ensureAllTables(asSqlTag(db));
  return db;
}

const rows = (db: Db, table: string) => db.query(`SELECT * FROM ${table} ORDER BY id`);

/* ------------------------------------------------------------- source data */

const source = await freshShop();

const product = (slug: string, name: string, visible: boolean, sort: number) =>
  source.query(
    `INSERT INTO products (slug, name, category, collections, material_tier, price, original_price,
       sale_price, currency, in_stock, featured, shop_visible, custom_gallery, short_description,
       description, variant_label, specs, variants, images, sort_order)
     VALUES ($1,$2,'wrestling',$3,'hd-cnc-premium',$4,$5,NULL,'USD',TRUE,FALSE,$6,FALSE,
       'short','long description',$7,$8,$9,$10,$11)`,
    [
      slug,
      name,
      ['wrestling', '24k-gold'],
      '470.00',
      '545.00',
      visible,
      'Build',
      JSON.stringify({ plating: '24k', thickness: '6mm' }),
      JSON.stringify([{ id: '6mm-cnc', name: '6mm CNC', salePrice: 470, isDefault: true }]),
      JSON.stringify([{ src: 'https://x.public.blob.vercel-storage.com/a.webp', alt: 'A belt' }]),
      sort,
    ]
  );

await product('continental-crown', 'Continental Crown Championship Belt', true, 0);
await product('hidden-draft', 'Hidden Draft Belt', false, 1);

await source.query(
  `INSERT INTO orders (reference, kind, channel, status, customer_name, customer_email,
     customer_phone, customer_note, items, subtotal, currency, payment_method, payment_reference,
     payment_verified, submitter_key)
   VALUES ('MA-AAAA2','cart','crypto','paid','Ada Lovelace','ada@example.com','+92 302 405 7417',
     'please ship fast', $1, '940.00','USD','crypto','tx-123',TRUE,'iphash')`,
  [JSON.stringify([{ slug: 'continental-crown', name: 'Continental Crown', quantity: 2, total: 940 }])]
);
await source.query(
  `INSERT INTO orders (reference, kind, channel, status, customer_name, customer_email, build_spec,
     subtotal, currency, design_url)
   VALUES ('MA-BBBB3','build','form','new','Grace','grace@example.com',$1,0,'USD',
     'https://x.public.blob.vercel-storage.com/design.png')`,
  [JSON.stringify({ describedAs: [['Plate material', 'Zinc']], budget: '400-600' })]
);

await source.query(
  `INSERT INTO reviews (product_slug, author_name, rating, title, body, status, verified, photos)
   VALUES ('continental-crown','Sam',5,'Superb','Heavy and beautifully etched.','approved',TRUE,$1)`,
  [JSON.stringify(['https://x.public.blob.vercel-storage.com/review-photos/1.jpg'])]
);
await source.query(
  `INSERT INTO reviews (product_slug, author_name, rating, body)
   VALUES ('continental-crown','Lee',4,'Good, arrived on time.')`
);

await source.query(
  `INSERT INTO customers (google_sub, email, name, phone, password_hash)
   VALUES (NULL,'ada@example.com','Ada','+92 302 405 7417','SALT:SECRETHASH')`
);
await source.query(
  `INSERT INTO customers (google_sub, email, name) VALUES ('g-123','sam@example.com','Sam')`
);

// Things that must NEVER appear in a backup file.
await source.query(
  `INSERT INTO admin_auth (id, username, password_hash) VALUES (1,'admin','ADMIN:HASH')`
);
await source.query(`INSERT INTO auth_attempts (key) VALUES ('secret-rate-limit-key')`);
await source.query(
  `INSERT INTO password_resets (email, token_hash, expires_at)
   VALUES ('ada@example.com','RESETTOKENHASH', NOW() + interval '1 hour')`
);

/* ------------------------------------------------------------------ export */

console.log('\n=== export ===');

const exported = await exportBackup(source);
const fileText = serialiseBackup(exported);
// Through real JSON, exactly as a file on disk would come back.
const backup = JSON.parse(fileText) as BackupFile;

await test('every table is exported with the right row count', async () => {
  assert.deepEqual(backup.meta.counts, { products: 2, orders: 2, reviews: 2, customers: 2 });
});

await test('a customer password hash never appears in the file', async () => {
  assert.equal(fileText.includes('SECRETHASH'), false);
  assert.equal(
    backup.tables.customers!.every((c) => !('password_hash' in c)),
    true
  );
});

await test('the admin password, reset tokens and rate-limit keys are not in the file', async () => {
  assert.equal(fileText.includes('ADMIN:HASH'), false);
  assert.equal(fileText.includes('RESETTOKENHASH'), false);
  assert.equal(fileText.includes('secret-rate-limit-key'), false);
  assert.equal('admin_auth' in backup.tables, false);
});

await test('the file records what it deliberately left out', async () => {
  assert.deepEqual(backup.meta.excludedColumns, { customers: ['password_hash'] });
});

await test('a source missing a table still backs up the rest', async () => {
  const partial = await freshShop();
  await partial.query('DROP TABLE customers');
  const result = await exportBackup(partial);
  assert.deepEqual(result.meta.missingTables, ['customers']);
  assert.equal('customers' in result.tables, false);
});

/* ----------------------------------------------------------------- restore */

console.log('\n=== restore into a brand new, empty database ===');

const target = await freshShop();
const first = await restoreBackup(target, backup);

await test('every row is added', async () => {
  assert.deepEqual(first, {
    products: { inserted: 2, skipped: 0 },
    orders: { inserted: 2, skipped: 0 },
    reviews: { inserted: 2, skipped: 0 },
    customers: { inserted: 2, skipped: 0 },
  });
});

await test('products come back identical: arrays, JSON, prices, timestamps', async () => {
  assert.deepStrictEqual(await rows(target, 'products'), await rows(source, 'products'));
});

await test('orders come back identical, including build specs and payment fields', async () => {
  assert.deepStrictEqual(await rows(target, 'orders'), await rows(source, 'orders'));
});

await test('reviews come back identical, photos included', async () => {
  assert.deepStrictEqual(await rows(target, 'reviews'), await rows(source, 'reviews'));
});

await test('customers come back with their password hash empty, not copied', async () => {
  const restored = await rows(target, 'customers');
  const original = (await rows(source, 'customers')).map((c) => ({ ...c, password_hash: null }));
  assert.deepStrictEqual(restored, original);
});

await test('new rows after a restore do not collide with restored ids', async () => {
  const before = await target.query('SELECT MAX(id)::text AS max FROM reviews');
  const inserted = await target.query(
    `INSERT INTO reviews (product_slug, author_name, rating, body)
     VALUES ('continental-crown','New',5,'Added after restore') RETURNING id::text AS id`
  );
  assert.ok(BigInt(String(inserted[0]!.id)) > BigInt(String(before[0]!.max)));
});

console.log('\n=== safety ===');

await test('restoring twice adds nothing and duplicates nothing', async () => {
  const again = await restoreBackup(target, backup);
  for (const table of Object.values(again)) assert.equal(table.inserted, 0);
  const n = await target.query('SELECT COUNT(*)::int AS n FROM products');
  assert.equal(n[0]!.n, 2);
});

await test('a restore never overwrites data that is already there', async () => {
  await target.query(`UPDATE products SET name = 'EDITED SINCE THE BACKUP' WHERE slug = 'continental-crown'`);
  await restoreBackup(target, backup);
  const after = await target.query(`SELECT name FROM products WHERE slug = 'continental-crown'`);
  assert.equal(after[0]!.name, 'EDITED SINCE THE BACKUP');
});

await test('a column the target does not have is ignored, not fatal', async () => {
  const future = structuredClone(backup);
  future.tables.products![0]!.column_from_a_newer_schema = 'x';
  const fresh = await freshShop();
  const result = await restoreBackup(fresh, future);
  assert.equal(result.products!.inserted, 2);
});

await test('a hostile column name in a backup cannot inject SQL', async () => {
  const hostile = structuredClone(backup);
  hostile.tables.products![0]!['id"; DROP TABLE products; --'] = 'x';
  const fresh = await freshShop();
  await restoreBackup(fresh, hostile);
  const n = await fresh.query('SELECT COUNT(*)::int AS n FROM products');
  assert.equal(n[0]!.n, 2, 'products table must still exist and be populated');
});

await test('a file that is not a backup is refused', async () => {
  await assert.rejects(() => restoreBackup(target, { hello: 'world' } as unknown as BackupFile));
});

await test('a backup from a different format version is refused', async () => {
  const wrong = structuredClone(backup);
  wrong.meta.version = 99;
  await assert.rejects(() => restoreBackup(target, wrong), /Unsupported backup version/);
});

console.log(`\nALL ${passed} BACKUP TESTS PASSED\n`);
