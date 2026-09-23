/**
 * Proposes cleaned-up product names: Title Case, known typos fixed, prices
 * taken out of names.
 *
 *   npm run tidy-names                    dry run: writes a before/after list
 *   npm run tidy-names -- --apply         applies it, after saving a snapshot
 *   npm run tidy-names -- --undo backups/names-before-<date>.json
 *
 * Deliberately NARROW. It does not remove trademarks (WWE, AEW, ...) — that is
 * the owner's decision — and it keeps the spec words (6mm CNC, 24K Gold) in the
 * name, because several belts differ ONLY by those words ("TNA X Division 6mm
 * CNC" vs "... Black Leather") and stripping them would create duplicate names.
 * Slugs never change, so no URL, cart or order is affected.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

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

if (undoFile) {
  const before = JSON.parse(readFileSync(undoFile, 'utf8')) as Record<string, string>;
  for (const [slug, name] of Object.entries(before)) {
    await sql`UPDATE products SET name = ${name}, updated_at = NOW() WHERE slug = ${slug}`;
  }
  console.log(`Restored ${Object.keys(before).length} names from ${undoFile}.`);
  process.exit(0);
}

/** Kept in capitals: promotion names, techniques and codes. */
const ACRONYMS = new Set([
  'WWE', 'AEW', 'TNA', 'NWA', 'WCW', 'WWC', 'IWGP', 'ROH', 'UFC', 'NFL', 'MMA', 'MJF',
  'TBS', 'TNT', 'CNC', 'HD', 'SD', 'IC', 'TV', 'US', 'USA', 'LA', 'WF', 'UK', 'ECW', '3D',
]);

/** Word-level fixes for typos found in the catalogue. */
const TYPOS: Record<string, string> = {
  GOLBAL: 'Global',
  HONGAN: 'Hogan',
  STONS: 'Stones',
  MATE: 'Made', // "HAND MATE LEATHER" — joined to "Hand-Made" below
  '24L': '24K',
  NFE: 'NFL',
};

const SMALL = new Set(['of', 'and', 'the', 'with', 'a', 'on']);

function word(raw: string, index: number): string {
  const upper = raw.toUpperCase();
  if (TYPOS[upper]) return TYPOS[upper]!;
  if (ACRONYMS.has(upper)) return upper;
  if (/^\d+MM$/i.test(raw)) return raw.toLowerCase(); // 6MM -> 6mm
  if (/^\d+K$/i.test(raw)) return upper; // 24k -> 24K
  if (/^\d+(ST|ND|RD|TH)$/i.test(raw)) return raw.toLowerCase(); // 4TH -> 4th
  const lower = raw.toLowerCase();
  if (index > 0 && SMALL.has(lower)) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function tidyName(name: string): string {
  return name
    .replace(/\$\s?\d[\d,.]*/g, ' ') // no prices inside names
    .split(/\s+/)
    .filter(Boolean)
    .map(word)
    .join(' ')
    .replace(/\bHand Made\b/g, 'Hand-Made')
    .trim();
}

/** Only names that need it: all capitals, a lower-case word, a typo or a price. */
function needsTidy(name: string): boolean {
  if (name === name.toUpperCase()) return true;
  if (/\$\d/.test(name)) return true;
  if (/\b[a-z]{3,}/.test(name) && !/^[A-Z]/.test(name)) return true;
  if (/(^|\s)[a-z]/.test(name.split(' ').filter((w) => w.length > 3).join(' '))) return true;
  return Object.keys(TYPOS).some((t) => new RegExp(`\\b${t}\\b`, 'i').test(name) && t !== 'MATE')
    || /\bHAND MATE\b/i.test(name)
    || /\bUl[A-Z]/.test(name);
}

const rows = (await sql`SELECT slug, name FROM products ORDER BY sort_order, created_at`) as {
  slug: string;
  name: string;
}[];

const changes = rows
  .filter((r) => needsTidy(r.name))
  .map((r) => ({ slug: r.slug, before: r.name, after: tidyName(r.name) }))
  .filter((c) => c.after !== c.before);

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
mkdirSync('backups', { recursive: true });

const csvCell = (s: string) => `"${s.replace(/"/g, '""')}"`;
const listPath = `backups/name-proposals-${stamp}.csv`;
writeFileSync(
  listPath,
  ['slug,current name,proposed name', ...changes.map((c) => [c.slug, c.before, c.after].map(csvCell).join(','))].join('\n')
);

console.log(`${rows.length} names checked, ${changes.length} would change.`);
console.log(`Full before/after list (opens in Excel): ${listPath}`);
console.log('');
for (const c of changes.slice(0, 14)) {
  console.log(`  ${c.before}`);
  console.log(`    -> ${c.after}`);
}
if (changes.length > 14) console.log(`  ... and ${changes.length - 14} more in the file`);

if (!apply) {
  console.log('');
  console.log('Dry run — nothing was written. Run with --apply once the list is approved.');
  process.exit(0);
}

const snapshot = `backups/names-before-${stamp}.json`;
writeFileSync(snapshot, JSON.stringify(Object.fromEntries(changes.map((c) => [c.slug, c.before])), null, 2));
for (const c of changes) {
  await sql`UPDATE products SET name = ${c.after}, updated_at = NOW() WHERE slug = ${c.slug}`;
}
console.log('');
console.log(`Renamed ${changes.length} belts. Old names saved to ${snapshot}`);
console.log(`To undo: npm run tidy-names -- --undo ${snapshot}`);
