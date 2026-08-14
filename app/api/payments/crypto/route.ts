import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { ensureOrdersTable } from '@/lib/db-schema';
import { getAllProducts } from '@/lib/products';
import { authoritativeLineTotal } from '@/lib/pricing';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PROOF_BYTES = 6 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const RATE_WINDOW_HOURS = 1;
const RATE_MAX = 5;

function makeReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (const byte of randomBytes(5)) out += alphabet[byte % alphabet.length];
  return `MA-${out}`;
}

function submitterKey(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

/**
 * Records a crypto payment claim.
 *
 * This endpoint does NOT confirm payment. It stores what the customer says
 * they sent, plus a screenshot, and marks the order as awaiting verification.
 * A screenshot is trivial to fabricate, so nothing here may be treated as
 * proof — an admin checks the transaction on-chain and confirms it manually.
 *
 * The order total is still recomputed from the catalogue, so the amount we
 * expect is ours, not whatever the page claimed.
 */
export async function POST(request: Request) {
  if (site.cryptoWallets.length === 0) {
    return NextResponse.json({ error: 'Crypto payment is not enabled.' }, { status: 503 });
  }

  const sql = db();
  if (!sql) {
    return NextResponse.json(
      { error: 'We cannot record payments right now. Please message us on WhatsApp.' },
      { status: 503 }
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const reference = String(form.get('txReference') ?? '').trim();
  const network = String(form.get('network') ?? '').trim();
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const note = String(form.get('note') ?? '').trim();

  if (reference.length < 6) {
    return NextResponse.json(
      { error: 'Please paste the transaction ID or hash from your wallet.' },
      { status: 400 }
    );
  }
  if (!email.includes('@')) {
    return NextResponse.json(
      { error: 'Please add an email so we can confirm your order.' },
      { status: 400 }
    );
  }

  let items: Record<string, unknown>[] = [];
  try {
    items = JSON.parse(String(form.get('items') ?? '[]')) as Record<string, unknown>[];
  } catch {
    return NextResponse.json({ error: 'Invalid cart.' }, { status: 400 });
  }

  const key = submitterKey(request);

  try {
    await ensureOrdersTable(sql);

    const recent = (await sql`
      SELECT COUNT(*)::int AS n
      FROM orders
      WHERE submitter_key = ${key}
        AND created_at > NOW() - make_interval(hours => ${RATE_WINDOW_HOURS})
    `) as unknown as { n: number }[];

    if ((recent[0]?.n ?? 0) >= RATE_MAX) {
      return NextResponse.json(
        { error: 'Too many submissions. Please contact us on WhatsApp.' },
        { status: 429 }
      );
    }

    /* ---- rebuild the cart server-side ---- */

    const products = await getAllProducts();
    const lines: Record<string, unknown>[] = [];
    let subtotal = 0;
    let currency = 'USD';

    for (const line of items.slice(0, 50)) {
      const product = products.find((p) => p.slug === String(line.slug));
      if (!product) continue;

      const quantity = Math.min(99, Math.max(1, Math.floor(Number(line.quantity) || 1)));
      const priced = authoritativeLineTotal(
        product,
        line.variantId ? String(line.variantId) : null,
        quantity
      );
      if (!priced) continue;

      subtotal += priced.total;
      currency = product.currency;
      lines.push({
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

    if (lines.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
    }

    /* ---- optional screenshot ---- */

    let proofUrl: string | null = null;
    const file = form.get('proof');

    if (file instanceof File && file.size > 0) {
      if (!ALLOWED.includes(file.type)) {
        return NextResponse.json(
          { error: 'Upload a JPG, PNG, WebP or PDF screenshot.' },
          { status: 400 }
        );
      }
      if (file.size > MAX_PROOF_BYTES) {
        return NextResponse.json({ error: 'That file is over 6MB.' }, { status: 400 });
      }
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        // Not fatal: the transaction reference is the part that actually
        // matters, and it is verifiable on-chain without the screenshot.
        console.warn('[payments/crypto] no blob token; proof not stored');
      } else {
        const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1] ?? 'jpg';
        const blob = await put(`payment-proofs/${Date.now()}.${ext}`, file, {
          access: 'public',
          addRandomSuffix: true,
        });
        proofUrl = blob.url;
      }
    }

    const orderRef = makeReference();

    await sql`
      INSERT INTO orders (
        reference, kind, channel, status,
        customer_name, customer_email, customer_note,
        items, subtotal, currency, submitter_key,
        payment_method, payment_reference, payment_network, payment_proof_url, payment_verified
      ) VALUES (
        ${orderRef}, 'cart', 'crypto', 'new',
        ${name || null}, ${email}, ${note || null},
        ${JSON.stringify(lines)},
        ${Math.round(subtotal * 100) / 100},
        ${currency},
        ${key},
        'crypto',
        ${reference.slice(0, 200)},
        ${network.slice(0, 60) || null},
        ${proofUrl},
        FALSE
      )
    `;

    return NextResponse.json({
      ok: true,
      reference: orderRef,
      expected: Math.round(subtotal * 100) / 100,
      currency,
    });
  } catch (error) {
    console.error('[payments/crypto] failed:', error);
    return NextResponse.json(
      { error: 'Could not record your payment. Please message us on WhatsApp.' },
      { status: 500 }
    );
  }
}
