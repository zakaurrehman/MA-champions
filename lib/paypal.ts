import 'server-only';

/**
 * PayPal Orders v2, server side only.
 *
 * The client secret never reaches the browser, and no amount sent by the
 * browser is ever trusted — every total here is recomputed from the catalogue.
 * A payment integration that takes the price from the page is a payment
 * integration that lets people buy $470 belts for $1.
 *
 * NOTE ON ELIGIBILITY: PayPal does not onboard businesses registered in
 * Pakistan. These credentials must come from a PayPal Business account in a
 * supported country. The integration stays dormant until they exist.
 */

const LIVE = 'https://api-m.paypal.com';
const SANDBOX = 'https://api-m.sandbox.paypal.com';

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/** Sandbox unless explicitly set to live, so test keys cannot take real money. */
export function paypalBase(): string {
  return process.env.PAYPAL_ENV === 'live' ? LIVE : SANDBOX;
}

export function paypalClientId(): string | null {
  return process.env.PAYPAL_CLIENT_ID ?? null;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * OAuth token, cached until shortly before it expires. PayPal tokens last
 * hours; fetching one per request would add a round trip to every checkout.
 */
export async function paypalToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error('PayPal is not configured.');

  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`);
  }

  const data = (await res.json()) as TokenResponse;

  // Refresh a minute early rather than racing the expiry.
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

export async function paypalFetch<T>(
  path: string,
  init: { method: string; body?: unknown }
): Promise<T> {
  const token = await paypalToken();

  const res = await fetch(`${paypalBase()}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => ({}))) as T & { message?: string };

  if (!res.ok) {
    throw new Error(`PayPal ${init.method} ${path} failed: ${res.status} ${data.message ?? ''}`);
  }

  return data;
}
