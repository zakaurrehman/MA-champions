import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureCustomersTable } from '@/lib/db-schema';
import { isAdmin } from '@/lib/adminAuth';
import { issueReset, markDelivered } from '@/lib/resetTokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Issues a reset link for the operator to send by hand.
 *
 * This exists because no transactional email service is configured yet: a
 * customer who cannot get in messages us on WhatsApp, and this is how we help
 * them without ever knowing or setting their password.
 *
 * The link is returned exactly once, in this response, and only to a signed-in
 * admin. It is stored hashed, so it cannot be looked up again afterwards — if
 * it gets lost, issue another.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const sql = db();
  if (!sql) {
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  }

  let email = '';
  try {
    const body = (await request.json()) as { email?: unknown };
    email = String(body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    await ensureCustomersTable(sql);

    const rows = (await sql`
      SELECT id FROM customers WHERE LOWER(email) = ${email} LIMIT 1
    `) as unknown as { id: number }[];

    // Enumeration is not a concern here — the admin can already see every
    // customer — so this says plainly that there is no such account, which is
    // what makes it useful for spotting a typo in the address.
    if (!rows[0]) {
      return NextResponse.json({ error: 'No account with that email.' }, { status: 404 });
    }

    const reset = await issueReset(email);
    if (!reset) {
      return NextResponse.json({ error: 'Could not create a link.' }, { status: 500 });
    }

    // The operator is about to send it, so it is no longer "waiting".
    await markDelivered(email);

    return NextResponse.json({ url: reset.url, expiresInMinutes: 60 });
  } catch (error) {
    console.error('[admin/resets] failed:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
