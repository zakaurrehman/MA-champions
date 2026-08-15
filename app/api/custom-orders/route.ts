import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { ensureOrdersTable } from '@/lib/db-schema';
import { CUSTOM_ORDER_GROUPS, describeSelection } from '@/lib/customOrder';
import { getSessionUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_WINDOW_HOURS = 1;
const RATE_MAX = 6;
const MAX_DESIGN_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'];

/** Excludes I, O, 0 and 1 so it survives being read aloud over WhatsApp. */
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
  const ua = request.headers.get('user-agent') ?? '';
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 32);
}

const text = (v: FormDataEntryValue | null, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/**
 * Custom belt order request.
 *
 * This is a QUOTE REQUEST, not a sale. No price is calculated and no money is
 * taken: a one-off build cannot be priced from a form, and quoting a number
 * here that we later revise is worse for the customer than quoting nothing.
 * The order lands in the admin panel as a "Custom build" for a human to price.
 *
 * Every option is validated against the list in lib/customOrder.ts. The
 * browser can send anything, so the spec we record is ours, not theirs.
 */
export async function POST(request: Request) {
  const sql = db();
  if (!sql) {
    return NextResponse.json(
      { error: 'We cannot take the form right now. Please message us on WhatsApp instead.' },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const name = text(form.get('name'), 120);
  const email = text(form.get('email'), 160);
  const phone = text(form.get('phone'), 60);
  const budget = text(form.get('budget'), 60);
  const instructions = text(form.get('instructions'), 4000);

  if (!name) return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 });
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const selection: Record<string, string> = {};
  for (const group of CUSTOM_ORDER_GROUPS) {
    selection[group.id] = text(form.get(group.id), 80);
  }
  const describedAs = describeSelection(selection);

  try {
    await ensureOrdersTable(sql);

    const key = submitterKey(request);
    const recent = (await sql`
      SELECT COUNT(*)::int AS n FROM orders
      WHERE submitter_key = ${key}
        AND created_at > NOW() - make_interval(hours => ${RATE_WINDOW_HOURS})
    `) as unknown as { n: number }[];

    if ((recent[0]?.n ?? 0) >= RATE_MAX) {
      return NextResponse.json(
        { error: 'You have sent several requests already. Please message us on WhatsApp.' },
        { status: 429 }
      );
    }

    /* ---- artwork ---- */

    let designUrl: string | null = null;
    const file = form.get('design');

    if (file instanceof File && file.size > 0) {
      if (!ACCEPTED.includes(file.type)) {
        return NextResponse.json(
          { error: 'Use a PNG, JPG, WEBP, SVG or PDF for your design.' },
          { status: 400 }
        );
      }
      if (file.size > MAX_DESIGN_BYTES) {
        return NextResponse.json({ error: 'That file is over 8MB.' }, { status: 400 });
      }

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const ext = file.name.split('.').pop()?.toLowerCase().slice(0, 5) || 'png';
        const blob = await put(`custom-designs/${Date.now()}.${ext}`, file, {
          access: 'public',
          addRandomSuffix: true,
        });
        designUrl = blob.url;
      }
      // No blob token: the request still goes through. Losing the attachment is
      // worth far less than losing the enquiry, and we have their email.
    }

    const user = await getSessionUser();
    const reference = makeReference();

    await sql`
      INSERT INTO orders (
        reference, kind, channel, status,
        customer_name, customer_email, customer_phone, customer_note,
        items, build_spec, subtotal, currency, design_url, submitter_key
      ) VALUES (
        ${reference}, 'build', 'form', 'new',
        ${name}, ${email || user?.email || null}, ${phone || null}, ${instructions || null},
        '[]'::jsonb,
        ${JSON.stringify({ describedAs, budget: budget || null, source: 'custom-order-form' })},
        0, 'USD', ${designUrl}, ${key}
      )
    `;

    return NextResponse.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    console.error('[api/custom-orders] failed:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please message us on WhatsApp so nothing is lost.' },
      { status: 500 }
    );
  }
}
