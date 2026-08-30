/**
 * Guest order access tests.
 *
 * Run: npm run test:orders
 *
 * Covers the two things standing between a stranger and a customer's order:
 * contact matching, and the signed access token. A regression in either is an
 * IDOR — guess a reference, read someone's order — so these are the cases that
 * matter most in the whole codebase.
 */

import assert from 'node:assert/strict';
import { contactMatches, contactKind, phoneTail, normaliseEmail } from '../lib/contact.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  PASS  ${name}`);
}

console.log('\n=== contact kind detection ===');

test('an address is an email', () => assert.equal(contactKind('bob@example.com'), 'email'));
test('a long number is a phone', () => assert.equal(contactKind('+92 302 405 7417'), 'phone'));
test('a local number is a phone', () => assert.equal(contactKind('03024057417'), 'phone'));
test('a short string is neither', () => assert.equal(contactKind('abc'), 'unknown'));
test('empty is neither', () => assert.equal(contactKind('   '), 'unknown'));

console.log('\n=== email matching ===');

const order = { email: 'Bob@Example.com', phone: '+92 302 405 7417' };

test('exact email matches', () => assert.equal(contactMatches('Bob@Example.com', order), true));
test('case is ignored', () => assert.equal(contactMatches('bob@example.com', order), true));
test('surrounding space is ignored', () =>
  assert.equal(contactMatches('  bob@example.com  ', order), true));
test('a different email does not match', () =>
  assert.equal(contactMatches('eve@example.com', order), false));
test('normaliseEmail lowercases and trims', () =>
  assert.equal(normaliseEmail('  A@B.COM '), 'a@b.com'));

console.log('\n=== phone matching ===');

test('the same number formatted differently matches', () =>
  assert.equal(contactMatches('0302 405 7417', order), true));
test('with country code matches', () =>
  assert.equal(contactMatches('+923024057417', order), true));
test('without country code matches', () =>
  assert.equal(contactMatches('3024057417', order), true));
test('a different number does not match', () =>
  assert.equal(contactMatches('+92 300 111 2222', order), false));
test('phoneTail keeps the last nine digits', () =>
  assert.equal(phoneTail('+92 302 405 7417'), '024057417'));

console.log('\n=== the rules that stop an order leaking ===');

test('an email is never matched against the phone column', () =>
  assert.equal(contactMatches('bob@example.com', { email: null, phone: '923024057417' }), false));

test('a phone is never matched against the email column', () =>
  assert.equal(contactMatches('923024057417', { email: 'bob@example.com', phone: null }), false));

test('an order with no contact details cannot be unlocked', () =>
  assert.equal(contactMatches('bob@example.com', { email: null, phone: null }), false));

test('an empty submission never matches an empty stored value', () =>
  assert.equal(contactMatches('', { email: null, phone: null }), false));

test('an empty submission never matches a real order', () =>
  assert.equal(contactMatches('', order), false));

test('a too-short number cannot brute-force a match', () =>
  assert.equal(contactMatches('7417', order), false));

/*
 * The token is HMAC-signed with AUTH_SECRET. A throwaway one is used when the
 * environment has none, so these always run — a security test that silently
 * skips is worse than no test, because the summary still says "passed".
 *
 * lib/orderAccess.ts imports 'server-only', hence --conditions=react-server in
 * the npm script: without it that import throws before any test runs.
 */
process.env.AUTH_SECRET ||= 'test-only-secret-at-least-thirty-two-chars';
console.log('\n=== order access tokens ===');

{
  const { createOrderAccessToken, verifyOrderAccessToken } = await import('../lib/orderAccess.ts');

  const token = createOrderAccessToken('MA-7QK2F')!;

  test('a freshly issued token verifies', () =>
    assert.equal(verifyOrderAccessToken('MA-7QK2F', token), true));

  test('a token does not work on another order', () =>
    assert.equal(verifyOrderAccessToken('MA-AAAAA', token), false));

  test('a tampered signature is rejected', () =>
    assert.equal(verifyOrderAccessToken('MA-7QK2F', token.slice(0, -1) + 'x'), false));

  test('a token with no signature is rejected', () =>
    assert.equal(verifyOrderAccessToken('MA-7QK2F', '9999999999'), false));

  test('an empty token is rejected', () =>
    assert.equal(verifyOrderAccessToken('MA-7QK2F', ''), false));

  test('an expired token is rejected', () => {
    const [, signature] = token.split('.');
    const past = Math.floor(Date.now() / 1000) - 60;
    assert.equal(verifyOrderAccessToken('MA-7QK2F', `${past}.${signature}`), false);
  });
}

console.log(`\nALL ${passed} ORDER ACCESS TESTS PASSED\n`);
