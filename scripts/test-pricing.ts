/**
 * Pricing tests.
 *
 * Run: npm run test:pricing
 *
 * Covers the cases that cost real money if they regress — variant price
 * resolution, discount maths, backward compatibility with products that have
 * no variants, and rejection of tampered checkout input.
 */

import assert from 'node:assert/strict';
import {
  resolvePrice,
  discountPercent,
  authoritativeLineTotal,
  priceRange,
} from '../lib/pricing.ts';
import type { Product } from '../lib/types.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  PASS  ${name}`);
}

const base = {
  id: 'test',
  visibility: { shop: true, customGallery: false, reason: '' },
  slug: 'test-belt',
  category: 'wrestling',
  collections: [],
  materialTier: 'hd-cnc-premium',
  currency: 'USD',
  inStock: true,
  featured: false,
  rating: null,
  reviewCount: 0,
  shortDescription: '',
  description: '',
  specs: {},
  images: [],
} as unknown as Product;

console.log('\n=== TEST 1: simple product, original + sale ===');

const simple: Product = { ...base, name: 'Simple', price: 450, salePrice: null, originalPrice: 520 };
test('charges the sale price', () => assert.equal(resolvePrice(simple).current, 450));
test('shows $520 as compare-at', () => assert.equal(resolvePrice(simple).original, 520));
test('computes 13% off', () => assert.equal(resolvePrice(simple).discountPercent, 13));

console.log('\n=== TEST 2: variant pricing ===');

const varied: Product = {
  ...base,
  name: 'Varied',
  price: 450,
  salePrice: null,
  originalPrice: null,
  variantLabel: 'Plate thickness',
  variants: [
    { id: '4mm', name: '4mm', originalPrice: 520, salePrice: 450, stock: null, inStock: true },
    { id: '6mm', name: '6mm', originalPrice: 600, salePrice: 500, stock: 3, inStock: true },
    { id: '8mm', name: '8mm', originalPrice: null, salePrice: 550, stock: 0, inStock: false },
  ],
};

test('4mm resolves to $450', () => assert.equal(resolvePrice(varied, '4mm').current, 450));
test('6mm resolves to $500', () => assert.equal(resolvePrice(varied, '6mm').current, 500));
test('8mm resolves to $550', () => assert.equal(resolvePrice(varied, '8mm').current, 550));
test('4mm shows its own compare-at $520', () =>
  assert.equal(resolvePrice(varied, '4mm').original, 520));
test('6mm shows its own compare-at $600', () =>
  assert.equal(resolvePrice(varied, '6mm').original, 600));
test('6mm discount is 17%', () => assert.equal(resolvePrice(varied, '6mm').discountPercent, 17));
test('8mm shows no discount (no compare-at)', () =>
  assert.equal(resolvePrice(varied, '8mm').discountPercent, null));
test('no variant given falls back to first in stock, NOT the base price', () =>
  assert.equal(resolvePrice(varied).current, 450));
test('price range spans the variants', () =>
  assert.deepEqual(priceRange(varied), { min: 450, max: 550 }));

console.log('\n=== TEST 4: backward compatibility ===');

const legacy: Product = { ...base, name: 'Legacy', price: 430, salePrice: null };
test('product with only `price` still resolves', () =>
  assert.equal(resolvePrice(legacy).current, 430));
test('legacy product shows no compare-at', () => assert.equal(resolvePrice(legacy).original, null));
test('legacy product shows no discount badge', () =>
  assert.equal(resolvePrice(legacy).discountPercent, null));
test('legacy product has no variant', () => assert.equal(resolvePrice(legacy).variant, null));

const withSale: Product = { ...base, name: 'Sale', price: 500, salePrice: 400 };
test('legacy salePrice still wins over price', () =>
  assert.equal(resolvePrice(withSale).current, 400));

console.log('\n=== discount guards ===');

test('never negative when original is lower', () => assert.equal(discountPercent(400, 450), null));
test('never 0% when prices are equal', () => assert.equal(discountPercent(450, 450), null));
test('null original yields null', () => assert.equal(discountPercent(null, 450), null));
test('zero original yields null', () => assert.equal(discountPercent(0, 450), null));

console.log('\n=== checkout cannot be tampered with ===');

test('unknown variant id is rejected', () =>
  assert.equal(authoritativeLineTotal(varied, 'free-please', 1), null));
test('variant product cannot be bought without a variant', () =>
  assert.equal(authoritativeLineTotal(varied, null, 1), null));
test('quantity 0 is rejected', () => assert.equal(authoritativeLineTotal(varied, '6mm', 0), null));
test('negative quantity is rejected', () =>
  assert.equal(authoritativeLineTotal(varied, '6mm', -3), null));
test('fractional quantity is rejected', () =>
  assert.equal(authoritativeLineTotal(varied, '6mm', 1.5), null));
test('server recomputes 2 × 6mm as $1000, ignoring any client figure', () =>
  assert.equal(authoritativeLineTotal(varied, '6mm', 2)!.total, 1000));
test('simple product priced from the catalogue', () =>
  assert.equal(authoritativeLineTotal(simple, null, 3)!.total, 1350));

console.log(`\nALL ${passed} PRICING TESTS PASSED\n`);
