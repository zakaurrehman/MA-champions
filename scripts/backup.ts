/**
 * Takes a full backup of the shop's data to a local file.
 *
 *   npm run backup
 *
 * Writes backups/backup-<date>.json: products, orders, reviews and customers.
 * Restore it with `npm run restore -- backups/<file>.json`.
 *
 * The file contains customer names, emails, phone numbers and order details.
 * The backups/ folder is git-ignored so it cannot be committed by accident.
 * Keep the file somewhere private — not in a public repo, not in a shared
 * chat, not emailed unencrypted.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { exportBackup, serialiseBackup } from './lib/backup.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  console.error('Put it in .env.local, then: npm run backup');
  process.exit(1);
}

const sql = neon(url);
const host = url.match(/@([^/]+)\//)?.[1] ?? 'the database';

console.log(`Backing up ${host}…`);

let file;
try {
  file = await exportBackup({ query: (text, params) => sql.query(text, params) });
} catch (error) {
  const message = String((error as { message?: unknown })?.message ?? error);

  if (/quota|\b402\b|payment required/i.test(message)) {
    console.error('');
    console.error('The database provider is blocking access (data transfer quota exceeded).');
    console.error('There is nothing to back up until access is restored — the data itself is');
    console.error('not lost. Upgrade the plan or wait for the allowance to reset, then run');
    console.error('this again. Take a backup FIRST, before anything else.');
  } else {
    console.error('');
    console.error('Backup failed:', message.split('\n')[0]);
  }
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
mkdirSync('backups', { recursive: true });
const path = `backups/backup-${stamp}.json`;
const body = serialiseBackup(file);
writeFileSync(path, body, 'utf8');

console.log('');
console.log('Backup written:');
console.log(`  ${path}  (${(body.length / 1024).toFixed(0)} KB)`);
console.log('');
for (const [table, count] of Object.entries(file.meta.counts)) {
  console.log(`  ${table.padEnd(10)} ${count}`);
}
if (file.meta.missingTables.length > 0) {
  console.log(`  (not present in this database: ${file.meta.missingTables.join(', ')})`);
}
console.log('');
console.log('Not included, on purpose: admin password, customer password hashes and');
console.log('reset tokens. Customers restored from this file sign in with Google or use');
console.log('"forgotten password".');
console.log('');
console.log('This file holds customer names, emails, phones and orders. Keep it private.');
