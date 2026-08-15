import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { ensureAuthAttemptsTable, ensureCustomersTable } from '@/lib/db-schema';
import { emailConfigured, sendEmail } from '@/lib/email';
import { hashPassword, passwordProblem } from '@/lib/password';
import { consumeReset, issueReset, markDelivered } from '@/lib/resetTokens';
import { site } from '@/lib/site';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_WINDOW_MINUTES = 60;
const RATE_MAX_REQUESTS = 5;

/**
 * The same answer whether or not the address has an account. A "no such
 * account" here would turn the forgotten-password form into a customer list.
 */
const SAME_ANSWER = {
  ok: true,
  message:
    'If that email has an account, a reset link is on its way. Check your spam folder too.',
};

function ipKey(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return `reset:${createHash('sha256').update(ip).digest('hex').slice(0, 24)}`;
}

/** Request a reset link. */
export async function POST(request: Request) {
  const sql = db();
  if (!sql) {
    return NextResponse.json({ error: 'Accounts are unavailable right now.' }, { status: 503 });
  }

  let email = '';
  try {
    const body = (await request.json()) as { email?: unknown };
    email = String(body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!email.includes('@') || email.length > 200) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    await ensureCustomersTable(sql);
    await ensureAuthAttemptsTable(sql);

    // Rate limited per IP, not per email: otherwise anyone could flood one
    // customer's inbox by repeating their address.
    const key = ipKey(request);
    const attempts = (await sql`
      SELECT COUNT(*)::int AS n FROM auth_attempts
      WHERE key = ${key} AND created_at > NOW() - make_interval(mins => ${RATE_WINDOW_MINUTES})
    `) as unknown as { n: number }[];

    if ((attempts[0]?.n ?? 0) >= RATE_MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many reset requests. Please try again later.' },
        { status: 429 }
      );
    }
    await sql`INSERT INTO auth_attempts (key) VALUES (${key})`;

    const rows = (await sql`
      SELECT id FROM customers WHERE LOWER(email) = ${email} LIMIT 1
    `) as unknown as { id: number }[];

    // No account: stop here, but answer exactly as if we had sent something.
    if (!rows[0]) return NextResponse.json(SAME_ANSWER);

    const reset = await issueReset(email);
    if (!reset) return NextResponse.json(SAME_ANSWER);

    if (emailConfigured()) {
      const sent = await sendEmail({
        to: email,
        subject: `Reset your ${site.name} password`,
        text:
          `Someone asked to reset the password for this email address at ${site.name}.\n\n` +
          `Open this link to choose a new password. It expires in one hour and can only be used once:\n\n` +
          `${reset.url}\n\n` +
          `If this was not you, you can ignore this email — nothing has changed.`,
      });
      if (sent) await markDelivered(email);
    }

    /*
     * When no email service is configured the link is still created and still
     * valid — it just has to be handed over by a human. It appears in the admin
     * panel under "Password resets" for the operator to send. What we never do
     * is return it to whoever filled in the form; that would let anyone reset
     * any account.
     */
    return NextResponse.json(SAME_ANSWER);
  } catch (error) {
    console.error('[auth/reset] request failed:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

/** Use a reset link to set a new password. */
export async function PUT(request: Request) {
  const sql = db();
  if (!sql) {
    return NextResponse.json({ error: 'Accounts are unavailable right now.' }, { status: 503 });
  }

  let token = '';
  let newPassword = '';
  try {
    const body = (await request.json()) as { token?: unknown; newPassword?: unknown };
    token = String(body.token ?? '');
    newPassword = String(body.newPassword ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const problem = passwordProblem(newPassword);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  try {
    await ensureCustomersTable(sql);

    // Validated and burned in one statement, so a link cannot be used twice.
    const email = await consumeReset(token);
    if (!email) {
      return NextResponse.json(
        { error: 'That link has expired or has already been used. Please request a new one.' },
        { status: 400 }
      );
    }

    const hash = await hashPassword(newPassword);
    const rows = (await sql`
      UPDATE customers SET password_hash = ${hash}
      WHERE LOWER(email) = LOWER(${email})
      RETURNING email, name
    `) as unknown as { email: string; name: string | null }[];

    const customer = rows[0];
    if (!customer) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    // Sign them straight in — they have just proved they control the address.
    const session = createSessionToken({
      sub: `email:${customer.email}`,
      email: customer.email,
      name: customer.name || customer.email.split('@')[0] || 'Customer',
    });

    const response = NextResponse.json({ ok: true });
    if (session) response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('[auth/reset] confirm failed:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
