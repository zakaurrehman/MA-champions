import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { contactMatches } from '@/lib/contact';
import { verifyOrderAccessToken } from '@/lib/orderAccess';
import { detailView, summaryView, type OrderRowForView } from '@/lib/orderView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_WINDOW_MINUTES = 15;
const RATE_MAX_LOOKUPS = 20;
/** A wrong contact detail is a much stronger signal than a wrong reference. */
const RATE_MAX_FAILED_CONTACT = 8;

function lookupKey(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

/**
 * Guest order lookup.
 *
 * Two levels, and which one you get depends on what you can prove:
 *
 *  - Reference alone → the status summary. Safe if guessed: a stage name, belt
 *    names, a courier tracking number. This is the behaviour the page has
 *    always had and existing customers rely on it.
 *  - Reference + the email or phone on the order, OR a signed access token
 *    from the checkout redirect → the full order: prices, total, payment
 *    status, masked contact details.
 *
 * Anti-enumeration rules that hold throughout:
 *
 *  - A reference that does not exist and a reference with the wrong contact
 *    detail return the SAME message and the same status code. Any difference
 *    between them turns this endpoint into an oracle for "is MA-XXXXX real?".
 *  - Every attempt is counted per IP, and failed contact attempts are counted
 *    against a tighter limit, so the space cannot be swept.
 *  - References are random over a 32-character alphabet — roughly 33 million
 *    combinations — which only matters because of the limits above.
 */
export async function POST(request: Request) {
  const sql = db();
  if (!sql) {
    return NextResponse.json(
      { error: 'Order tracking is not available yet. Please message us instead.' },
      { status: 503 }
    );
  }

  let body: { reference?: unknown; contact?: unknown; token?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const reference = String(body.reference ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  const contact = String(body.contact ?? '').trim();
  const token = typeof body.token === 'string' ? body.token : null;

  if (!/^MA-[A-Z0-9]{5}$/.test(reference)) {
    return NextResponse.json(
      { error: 'That does not look like an order reference. They look like MA-7QK2F.' },
      { status: 400 }
    );
  }

  /** Identical for "no such order" and "wrong contact". Never differentiate. */
  const notFound = () =>
    NextResponse.json(
      {
        error:
          'We could not find an order matching those details. Check the reference and the email or phone you used.',
      },
      { status: 404 }
    );

  try {
    const key = lookupKey(request);

    await sql`
      CREATE TABLE IF NOT EXISTS order_lookups (
        id         BIGSERIAL PRIMARY KEY,
        lookup_key TEXT NOT NULL,
        failed     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE order_lookups ADD COLUMN IF NOT EXISTS failed BOOLEAN NOT NULL DEFAULT FALSE`;

    const recent = (await sql`
      SELECT COUNT(*)::int AS n,
             COUNT(*) FILTER (WHERE failed)::int AS failures
      FROM order_lookups
      WHERE lookup_key = ${key}
        AND created_at > NOW() - make_interval(mins => ${RATE_WINDOW_MINUTES})
    `.catch(() => [{ n: 0, failures: 0 }])) as unknown as { n: number; failures: number }[];

    const seen = recent[0] ?? { n: 0, failures: 0 };

    if (seen.n >= RATE_MAX_LOOKUPS || seen.failures >= RATE_MAX_FAILED_CONTACT) {
      return NextResponse.json(
        { error: 'Too many lookups. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    const rows = (await sql`
      SELECT reference, status, kind, channel, items, subtotal, currency,
             customer_name, customer_email, customer_phone, customer_note,
             tracking_carrier, tracking_number,
             payment_method, payment_verified,
             created_at, updated_at
      FROM orders
      WHERE reference = ${reference}
      LIMIT 1
    `) as unknown as OrderRowForView[];

    const order = rows[0];

    const fail = async () => {
      await sql`INSERT INTO order_lookups (lookup_key, failed) VALUES (${key}, TRUE)`.catch(() => {});
      return notFound();
    };

    // No such reference. Counted as a failure — sweeping the space is exactly
    // what this limit exists to stop.
    if (!order) return fail();

    await sql`INSERT INTO order_lookups (lookup_key) VALUES (${key})`.catch(() => {});

    /*
     * Detail is unlocked by the signed token from the checkout redirect, or by
     * the contact detail recorded on the order. The token is checked first
     * because it is the stronger proof and costs no database work.
     */
    if (token && verifyOrderAccessToken(reference, token)) {
      return NextResponse.json({ ok: true, ...detailView(order) });
    }

    if (contact) {
      const matches = contactMatches(contact, {
        email: order.customer_email,
        phone: order.customer_phone,
      });

      // Wrong contact is answered exactly like a missing order, so the two
      // cannot be told apart from outside.
      if (!matches) return fail();

      return NextResponse.json({ ok: true, ...detailView(order) });
    }

    // Reference only — the summary, as before.
    return NextResponse.json({ ok: true, ...summaryView(order) });
  } catch (error) {
    console.error('[api/track] failed:', error);
    return NextResponse.json({ error: 'Lookup failed. Please try again.' }, { status: 500 });
  }
}
