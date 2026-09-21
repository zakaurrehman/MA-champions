/**
 * Loads a backup into a database.
 *
 *   npm run restore -- backups/backup-2026-09-21T10-30-00.json
 *   npm run restore -- backups/backup-....json --dry-run
 *
 * Aimed at whatever DATABASE_URL points to — including a brand new, empty
 * database on a different provider, which is the point: this is how the shop
 * moves if it ever has to.
 *
 * It only ADDS. Existing rows are never overwritten (see restoreBackup), so it
 * is safe to run twice and safe to aim at the wrong database.
 */

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { ensureAllTables } from '../lib/db-schema.ts';
import { asSqlTag, restoreBackup, validateBackup } from './lib/backup.ts';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const path = args.find((a) => !a.startsWith('--'));

if (!path) {
  console.error('Usage: npm run restore -- backups/<file>.json [--dry-run]');
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set — that is the database the backup is loaded INTO.');
  console.error('Put it in .env.local, then run this again.');
  process.exit(1);
}

let file: unknown;
try {
  file = JSON.parse(readFileSync(path, 'utf8'));
  validateBackup(file);
} catch (error) {
  console.error(`Cannot read ${path}:`, (error as Error).message);
  process.exit(1);
}

const host = url.match(/@([^/]+)\//)?.[1] ?? 'the database';
console.log(`Backup:   ${path}`);
console.log(`          taken ${file.meta.createdAt}`);
console.log(`Target:   ${host}`);
console.log('');
for (const [table, count] of Object.entries(file.meta.counts)) {
  console.log(`  ${table.padEnd(10)} ${count} rows in the backup`);
}
console.log('');

if (dryRun) {
  console.log('Dry run — nothing was written. Run again without --dry-run to restore.');
  process.exit(0);
}

const sql = neon(url);
const db = { query: (text: string, params?: unknown[]) => sql.query(text, params) };

try {
  // Create any missing tables first, from the same definitions the app uses.
  await ensureAllTables(asSqlTag(db));
  const results = await restoreBackup(db, file);

  console.log('Restored:');
  for (const [table, r] of Object.entries(results)) {
    console.log(`  ${table.padEnd(10)} ${r.inserted} added, ${r.skipped} already there`);
  }
  console.log('');
  console.log('Existing rows were left exactly as they were.');
  console.log('A running site caches the catalogue for up to an hour; saving any product in');
  console.log('the admin panel refreshes it straight away.');
} catch (error) {
  const message = String((error as { message?: unknown })?.message ?? error);
  if (/quota|\b402\b|payment required/i.test(message)) {
    console.error('The target database is blocking access (data transfer quota exceeded).');
  } else {
    console.error('Restore failed:', message.split('\n')[0]);
  }
  process.exit(1);
}
