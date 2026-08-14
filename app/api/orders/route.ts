import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { ensureOrdersTable } from '@/lib/db-schema';
import { getAllProducts } from '@/lib/products';
import { authoritativeLineTotal } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_WINDOW_HOURS = 1;
const RATE_MAX = 10;

interface LineInput {
  slug?: unknown;
  variantId?: unknown;
  quantity?: unknown;
  /** Free-text options (leather, engraving). Recorded, not priced. */
  specLines?: unknown;
}

/**
 * Short, unambiguous reference. Excludes I, O, 0 and 1 so it survives being
 * read aloud or retyped from a WhatsApp message.
 */
function makeReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(5);
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return `MA-${out}`;
}

function submitterKey(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const ua = request.headers.get('user-agent') ?? '';
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32);
}

const text = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/**
 * Records an order intent before the customer is handed to WhatsApp.
 *
 * WhatsApp is a closed app — we cannot read the conversation, so without this
 * an order only exists if the customer actually sends the message and the
 * owner notices it. This captures the cart, the build and the price at the
 * moment they clicked, so nothing is lost in the gap.
 *
 * IMPORTANT: prices are recomputed here from the catalogue. The browser sends
 * only slug, variant and quantity — anything it claims about price is ignored,
 * because a customer can edit it in devtools.
 */
export async function POST(request: Request) {
  const sql = db();
  // No database is not an error for the customer: the WhatsApp handoff still
  // works, they just do not get a reference number.
  if (!sql) return NextResponse.json({ ok: false, reason: 'no-database' }, { status: 202 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const kind = ['cart', 'product', 'build'].includes(String(body.kind))
    ? String(body.kind)
    : 'cart';
  const channel = ['whatsapp', 'email', 'copy'].includes(String(body.channel))
    ? String(body.channel)
    : 'whatsapp';

  const key = submitterKey(request);

  try {
    await ensureOrdersTable(sql);

    const recentRows = (await sql`
      SELECT COUNT(*)::int AS recent
      FROM orders
      WHERE submitter_key = ${key}
        AND created_at > NOW() - make_interval(hours => ${RATE_WINDOW_HOURS})
    `) as unknown as { recent: number }[];

    if ((recentRows[0]?.recent ?? 0) >= RATE_MAX) {
      return NextResponse.json({ ok: false, reason: 'rate-limited' }, { status: 429 });
    }

    /* ---- rebuild the order from the catalogue ---- */

    const products = await getAllProducts();
    const rawLines = Array.isArray(body.items) ? (body.items as LineInput[]) : [];

    const items: Record<string, unknown>[] = [];
    let subtotal = 0;
    let currency = 'USD';

    for (const line of rawLines.slice(0, 50)) {
      const product = products.find((p) => p.slug === String(line.slug));
      if (!product) continue;

      const quantity = Math.min(999, Math.max(1, Math.floor(Number(line.quantity) || 1)));
      const variantId = line.variantId ? String(line.variantId) : null;

      const priced = authoritativeLineTotal(product, variantId, quantity);
      // Null means an unknown variant or a variant product with none chosen.
      // Record the line without a price rather than inventing one.
      const unitPrice = priced?.unitPrice ?? null;
      const total = priced?.total ?? null;

      if (total !== null) subtotal += total;
      currency = product.currency;

      items.push({
        slug: product.slug,
        name: product.name,
        variantId,
        variantName: priced?.variant?.name ?? null,
        quantity,
        unitPrice,
        total,
        specLines: Array.isArray(line.specLines)
          ? (line.specLines as unknown[]).slice(0, 12).map((s) => text(s, 160))
          : [],
      });
    }

    if (items.length === 0 && kind !== 'build') {
      return NextResponse.json({ error: 'No valid items.' }, { status: 400 });
    }

    const reference = makeReference();

    await sql`
      INSERT INTO orders (
        reference, kind, channel, customer_name, customer_email, customer_note,
        items, build_spec, subtotal, currency, submitter_key
      ) VALUES (
        ${reference},
        ${kind},
        ${channel},
        ${text(body.customerName, 120) || null},
        ${text(body.customerEmail, 160) || null},
        ${text(body.note, 2000) || null},
        ${JSON.stringify(items)},
        ${body.buildSpec ? JSON.stringify(body.buildSpec) : null},
        ${Math.round(subtotal * 100) / 100},
        ${currency},
        ${key}
      )
    `;

    return NextResponse.json({ ok: true, reference, subtotal }, { status: 201 });
  } catch (error) {
    // Never block the handoff on a logging failure — the customer's order
    // matters more than our record of it.
    console.error('[api/orders] failed:', error);
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 202 });
  }
}
