/**
 * Generates blur placeholders for every product image.
 *
 * next/image can only auto-generate blurDataURL for statically imported files.
 * Our image paths come from data/products.json, so we precompute them here and
 * write them back into the JSON.
 *
 * Run after adding or replacing product photography:
 *   npm run blur
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = path.join(ROOT, 'data', 'products.json');
const PUBLIC_DIR = path.join(ROOT, 'public');

/** 12px wide is enough to read as a colour wash and keeps the string tiny. */
async function makeBlur(absPath) {
  const buf = await sharp(absPath).resize(12, null, { fit: 'inside' }).webp({ quality: 45 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function main() {
  const data = JSON.parse(await fs.readFile(JSON_PATH, 'utf8'));

  let generated = 0;
  let missing = 0;

  for (const product of data.products) {
    for (const image of product.images) {
      const abs = path.join(PUBLIC_DIR, image.src.replace(/\//g, path.sep));
      try {
        await fs.access(abs);
      } catch {
        console.warn(`  MISSING: ${image.src}`);
        missing += 1;
        continue;
      }

      image.blurDataURL = await makeBlur(abs);
      generated += 1;
    }
  }

  await fs.writeFile(JSON_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`blur placeholders generated: ${generated}`);
  if (missing) console.log(`images missing from disk: ${missing}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
