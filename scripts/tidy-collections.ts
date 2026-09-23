/**
 * One-time cleanup of product `collections`.
 *
 *   npm run tidy-collections                 dry run: prints what would change
 *   npm run tidy-collections -- --apply      writes it, after saving a snapshot
 *   npm run tidy-collections -- --undo backups/collections-before-<date>.json
 *
 * Why: `collections` was a free-text box in the admin panel. 25 belts carry
 * pasted description fragments as "categories", and the 63 belts added through
 * the admin were never tagged into a real collection — so the Wrestling page
 * showed 17 of 80 wrestling belts, and the sport pages were empty.
 *
 * What it does, per belt:
 *  1. keeps only real collection ids (sports and material tiers);
 *  2. ADDS a sport where the name says so plainly (UFC -> MMA, Super Bowl -> NFL)
 *     and otherwise "wrestling" for belts whose category is wrestling.
 * It never removes a real collection a belt already had.
 *
 * --apply first writes the old values to backups/, because `npm run restore`
 * only ever adds rows and so cannot put an edited column back. --undo can.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { LEAGUE_COLLECTIONS } from '../lib/leagues.ts';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const undoIndex = args.indexOf('--undo');
const undoFile = undoIndex >= 0 ? args[undoIndex + 1] : null;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Put it in .env.local.');
  process.exit(1);
}
const sql = neon(url);

/* ------------------------------------------------------------------ undo */

if (undoFile) {
  const before = JSON.parse(readFileSync(undoFile, 'utf8')) as Record<string, string[]>;
  let restored = 0;
  for (const [slug, collections] of Object.entries(before)) {
    const rows = await sql`
      UPDATE products SET collections = ${collections}, updated_at = NOW()
      WHERE slug = ${slug} RETURNING slug
    `;
    if (rows.length > 0) restored++;
  }
  console.log(`Restored the old collections on ${restored} belts from ${undoFile}.`);
  console.log('Save any product in the admin panel to refresh the live site straight away.');
  process.exit(0);
}

/* --------------------------------------------------------------- the plan */

// Same vocabulary as lib/collectionTags.ts, which the app cannot share with a
// plain Node script (it imports JSON through the "@/" alias).
const tiers = (JSON.parse(readFileSync('data/tiers.json', 'utf8')) as { tiers: { id: string }[] })
  .tiers;
const allowed = new Set([...LEAGUE_COLLECTIONS.map((l) => l.id), ...tiers.map((t) => t.id)]);

/** A sport the NAME states outright. Deliberately conservative. */
function sportFromName(name: string, category: string): string | null {
  if (/\b(UFC|MMA)\b/i.test(name)) return 'mma';
  if (/\bSUPER BOWL\b|\bNFL\b|\bNFE\b|DALLAS COWBOY/i.test(name)) return 'nfl';
  if (/\bBOXING\b/i.test(name)) return 'boxing';
  return category === 'wrestling' ? 'wrestling' : null;
}

const rows = (await sql`
  SELECT slug, name, category, collections FROM products ORDER BY sort_order, created_at
`) as { slug: string; name: string; category: string; collections: string[] | null }[];

const changes: { slug: string; name: string; before: string[]; after: string[] }[] = [];

for (const row of rows) {
  const before = row.collections ?? [];
  const kept = before.filter((c) => allowed.has(c));
  const sport = sportFromName(row.name, row.category);
  const after = [...new Set(sport ? [...kept, sport] : kept)];

  const same = after.length === before.length && after.every((c, i) => c === before[i]);
  if (!same) changes.push({ slug: row.slug, name: row.name, before, after });
}

/* ----------------------------------------------------------------- report */

const junk = changes.reduce(
  (n, c) => n + c.before.filter((v) => !allowed.has(v)).length,
  0
);
const tally = (id: string) =>
  rows.filter((r) => {
    const change = changes.find((c) => c.slug === r.slug);
    return (change ? change.after : r.collections ?? []).includes(id);
  }).length;

console.log(`${rows.length} belts checked, ${changes.length} would change.`);
console.log(`  junk values removed: ${junk}`);
console.log('');
console.log('Belts per sport collection AFTER this runs:');
for (const league of LEAGUE_COLLECTIONS) {
  console.log(`  ${league.name.padEnd(16)} ${tally(league.id)}`);
}

const notWrestling = changes.filter((c) => c.after.some((v) => ['mma', 'nfl', 'boxing'].includes(v)));
if (notWrestling.length > 0) {
  console.log('');
  console.log('Tagged to a sport other than wrestling, from the name — check these:');
  for (const c of notWrestling) console.log(`  ${c.after.join(', ').padEnd(22)} ${c.name}`);
}

if (!apply) {
  console.log('');
  console.log('Dry run — nothing was written. Run with --apply to make these changes.');
  process.exit(0);
}

/* ------------------------------------------------------------------ apply */

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
mkdirSync('backups', { recursive: true });
const snapshot = `backups/collections-before-${stamp}.json`;
writeFileSync(
  snapshot,
  JSON.stringify(Object.fromEntries(changes.map((c) => [c.slug, c.before])), null, 2)
);

for (const c of changes) {
  await sql`UPDATE products SET collections = ${c.after}, updated_at = NOW() WHERE slug = ${c.slug}`;
}

console.log('');
console.log(`Updated ${changes.length} belts. Old values saved to ${snapshot}`);
console.log(`To undo: npm run tidy-collections -- --undo ${snapshot}`);
console.log('The live site picks this up within the hour, or at once when any product is');
console.log('saved in the admin panel or the site is redeployed.');
