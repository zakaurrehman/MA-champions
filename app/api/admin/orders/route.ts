import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Whitelist, so `status` can never reach the query as arbitrary text. */
const STATUSES = new Set([
  'new',
  'quoted',
  'paid',
  'production',
  'shipped',
  'completed',
  'cancelled',
]);

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const sql = db();
  if (!sql) {
    return NextResponse.json({ error: 'No database configured.' }, { status: 503 });
  }

  let body: {
    id?: unknown;
    status?: unknown;
    adminNote?: unknown;
    trackingCarrier?: unknown;
    trackingNumber?: unknown;
    paymentVerified?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const id = Number(body.id);
  const status = String(body.status ?? '');

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
  }
  if (!STATUSES.has(status)) {
    return NextResponse.json({ error: 'Unknown status.' }, { status: 400 });
  }

  // Empty strings clear the field rather than storing "", so /track-order
  // shows no tracking block instead of an empty one.
  const trim = (v: unknown, max: number): string | null => {
    if (typeof v !== 'string') return null;
    const s = v.trim().slice(0, max);
    return s.length > 0 ? s : null;
  };

  try {
    await sql`
      UPDATE orders
      SET status           = ${status},
          tracking_carrier = ${trim(body.trackingCarrier, 60)},
          tracking_number  = ${trim(body.trackingNumber, 120)},
          admin_note       = COALESCE(${trim(body.adminNote, 2000)}, admin_note),
          -- Only ever set true here. Verification is a human decision and is
          -- never cleared as a side effect of a status change.
          payment_verified = payment_verified OR ${body.paymentVerified === true},
          updated_at       = NOW()
      WHERE id = ${id}
    `;
    return NextResponse.json({ ok: true, id, status });
  } catch (error) {
    console.error('[api/admin/orders] update failed:', error);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}
