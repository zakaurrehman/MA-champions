import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_WINDOW_MINUTES = 15;
const RATE_MAX_LOOKUPS = 20;

/** Human-readable stage for each stored status. */
const STAGES: Record<string, { label: string; detail: string; step: number }> = {
  new: {
    label: 'Received',
    detail: 'We have your request and are preparing your quote.',
    step: 1,
  },
  quoted: {
    label: 'Quoted',
    detail: 'Your quote has been sent. Production starts once it is confirmed.',
    step: 2,
  },
  paid: { label: 'Confirmed', detail: 'Payment received. Your belt is queued to build.', step: 3 },
  production: {
    label: 'In production',
    detail: 'Your belt is on the bench being made.',
    step: 4,
  },
  shipped: { label: 'Shipped', detail: 'On its way to you.', step: 5 },
  completed: { label: 'Delivered', detail: 'Order complete. Enjoy the belt.', step: 6 },
  cancelled: { label: 'Cancelled', detail: 'This order was cancelled.', step: 0 },
};

/* Not exported: a route module may only export the reserved handlers and
   config keys, and Next fails the build on anything else. */
const TOTAL_STEPS = 6;

function lookupKey(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

/**
 * Order status lookup by reference.
 *
 * Deliberately returns the minimum: stage, dates, belt names and a tracking
 * number. No customer name, no email, no address, no prices. A reference is a
 * weak secret — it gets read aloud over WhatsApp — so nothing here should be
 * damaging if someone guesses one.
 *
 * Guessing is also made impractical: references are random over a 32-character
 * alphabet, and lookups are rate limited per IP so the space cannot be swept.
 */
export async function POST(request: Request) {
  const sql = db();
  if (!sql) {
    return NextResponse.json(
      { error: 'Order tracking is not available yet. Please message us instead.' },
      { status: 503 }
    );
  }

  let body: { reference?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const reference = String(body.reference ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  if (!/^MA-[A-Z0-9]{5}$/.test(reference)) {
    return NextResponse.json(
      { error: 'That does not look like an order reference. They look like MA-7QK2F.' },
      { status: 400 }
    );
  }

  try {
    const key = lookupKey(request);

    const recent = (await sql`
      SELECT COUNT(*)::int AS n
      FROM order_lookups
      WHERE lookup_key = ${key}
        AND created_at > NOW() - make_interval(mins => ${RATE_WINDOW_MINUTES})
    `.catch(() => [{ n: 0 }])) as unknown as { n: number }[];

    if ((recent[0]?.n ?? 0) >= RATE_MAX_LOOKUPS) {
      return NextResponse.json(
        { error: 'Too many lookups. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    await sql`
      CREATE TABLE IF NOT EXISTS order_lookups (
        id         BIGSERIAL PRIMARY KEY,
        lookup_key TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`INSERT INTO order_lookups (lookup_key) VALUES (${key})`;

    const rows = (await sql`
      SELECT reference, status, items, tracking_carrier, tracking_number,
             created_at, updated_at
      FROM orders
      WHERE reference = ${reference}
      LIMIT 1
    `) as unknown as {
      reference: string;
      status: string;
      items: { name: string; quantity: number; variantName: string | null }[];
      tracking_carrier: string | null;
      tracking_number: string | null;
      created_at: string;
      updated_at: string;
    }[];

    const order = rows[0];
    if (!order) {
      return NextResponse.json(
        { error: 'We could not find that reference. Check it and try again.' },
        { status: 404 }
      );
    }

    const stage = STAGES[order.status] ?? STAGES.new!;

    return NextResponse.json({
      ok: true,
      reference: order.reference,
      stage: stage.label,
      detail: stage.detail,
      step: stage.step,
      totalSteps: TOTAL_STEPS,
      placedAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.items ?? []).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        variantName: i.variantName,
      })),
      tracking:
        order.tracking_number != null
          ? { carrier: order.tracking_carrier, number: order.tracking_number }
          : null,
    });
  } catch (error) {
    console.error('[api/track] failed:', error);
    return NextResponse.json({ error: 'Lookup failed. Please try again.' }, { status: 500 });
  }
}
