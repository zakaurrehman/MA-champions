import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { paypalConfigured, paypalFetch } from '@/lib/paypal';
import { db } from '@/lib/db';
import { ensureOrdersTable } from '@/lib/db-schema';
import { getAllProducts } from '@/lib/products';
import { authoritativeLineTotal } from '@/lib/pricing';
import { createOrderAccessToken } from '@/lib/orderAccess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CaptureResponse {
  id: string;
  status: string;
  payer?: {
    name?: { given_name?: string; surname?: string };
    email_address?: string;
    phone?: { phone_number?: { national_number?: string } };
  };
  purchase_units?: {
    payments?: {
      captures?: { id: string; status: string; amount: { value: string; currency_code: string } }[];
    };
    shipping?: { address?: Record<string, string> };
  }[];
}

function makeReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(5);
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return `MA-${out}`;
}

/**
 * Captures an approved PayPal order and records it as paid.
 *
 * The captured amount is checked against a freshly recomputed cart total. If
 * they disagree the order is still recorded — the customer's money has moved
 * and pretending otherwise would be worse — but it is flagged for review
 * rather than quietly accepted.
 */
export async function POST(request: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'Card payment is not enabled.' }, { status: 503 });
  }

  let body: { orderId?: unknown; items?: unknown; note?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const orderId = String(body.orderId ?? '');
  if (!/^[A-Z0-9]{5,32}$/i.test(orderId)) {
    return NextResponse.json({ error: 'Invalid order.' }, { status: 400 });
  }

  let capture: CaptureResponse;
  try {
    capture = await paypalFetch<CaptureResponse>(`/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('[paypal/capture] failed:', error);
    return NextResponse.json(
      { error: 'Payment could not be completed. You have not been charged twice.' },
      { status: 502 }
    );
  }

  if (capture.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: `Payment was not completed (${capture.status}).` },
      { status: 402 }
    );
  }

  const paid = capture.purchase_units?.[0]?.payments?.captures?.[0];
  const paidAmount = Number(paid?.amount.value ?? 0);
  const currency = paid?.amount.currency_code ?? 'USD';

  /* ---- rebuild the cart to record what was actually bought ---- */

  const products = await getAllProducts();
  const rawLines = Array.isArray(body.items) ? (body.items as Record<string, unknown>[]) : [];

  const items: Record<string, unknown>[] = [];
  let expected = 0;

  for (const line of rawLines.slice(0, 50)) {
    const product = products.find((p) => p.slug === String(line.slug));
    if (!product) continue;

    const quantity = Math.min(99, Math.max(1, Math.floor(Number(line.quantity) || 1)));
    const priced = authoritativeLineTotal(
      product,
      line.variantId ? String(line.variantId) : null,
      quantity
    );
    if (!priced) continue;

    expected += priced.total;
    items.push({
      slug: product.slug,
      name: product.name,
      variantId: priced.variant?.id ?? null,
      variantName: priced.variant?.name ?? null,
      quantity,
      unitPrice: priced.unitPrice,
      total: priced.total,
      specLines: [],
    });
  }

  const mismatch = Math.abs(expected - paidAmount) > 0.01;
  const reference = makeReference();

  const payerName = [capture.payer?.name?.given_name, capture.payer?.name?.surname]
    .filter(Boolean)
    .join(' ');

  const sql = db();
  if (sql) {
    try {
      await ensureOrdersTable(sql);
      await sql`
        INSERT INTO orders (
          reference, kind, channel, status,
          customer_name, customer_email, customer_phone, customer_note,
          items, subtotal, currency, admin_note
        ) VALUES (
          ${reference},
          'cart',
          'paypal',
          'paid',
          ${payerName || null},
          ${capture.payer?.email_address ?? null},
          ${capture.payer?.phone?.phone_number?.national_number ?? null},
          ${typeof body.note === 'string' ? body.note.slice(0, 2000) : null},
          ${JSON.stringify(items)},
          ${paidAmount},
          ${currency},
          ${
            mismatch
              ? `REVIEW: captured ${paidAmount} but cart recomputed to ${expected}. PayPal capture ${paid?.id}.`
              : `PayPal capture ${paid?.id}`
          }
        )
      `;
    } catch (error) {
      // The money has moved. Never fail the customer's checkout because our
      // bookkeeping failed — log loudly and let them see success.
      console.error('[paypal/capture] order not recorded:', reference, error);
    }
  }

  return NextResponse.json({
    ok: true,
    reference,
    // Lets the confirmation page show the full order immediately, without
    // asking the customer to type the email PayPal already gave us.
    accessToken: createOrderAccessToken(reference),
    amount: paidAmount,
    currency,
  });
}
