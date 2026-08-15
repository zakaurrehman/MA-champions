import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { ensureCustomersTable } from '@/lib/db-schema';
import { hashPassword, verifyPassword, passwordProblem } from '@/lib/password';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RATE_WINDOW_MINUTES = 15;
const RATE_MAX_ATTEMPTS = 10;
/** Uniform delay on every failure, so timing reveals nothing. */
const FAILURE_DELAY_MS = 600;

interface Row {
  id: number;
  email: string;
  name: string | null;
  password_hash: string | null;
}

function attemptKey(request: Request, email: string): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return createHash('sha256').update(`${ip}|${email.toLowerCase()}`).digest('hex').slice(0, 32);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Email and password sign-up / sign-in.
 *
 * Two rules run through this whole file:
 *
 * 1. Never reveal whether an email is registered. Sign-in returns the same
 *    message for an unknown address and a wrong password, and both take the
 *    same time. Otherwise this endpoint becomes a way to enumerate customers.
 * 2. Never store or return a password. Only the scrypt hash is persisted.
 */
export async function POST(request: Request) {
  const sql = db();
  if (!sql) {
    return NextResponse.json(
      { error: 'Accounts are unavailable right now. You can still check out as a guest.' },
      { status: 503 }
    );
  }

  let body: { mode?: unknown; email?: unknown; password?: unknown; name?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const mode = body.mode === 'register' ? 'register' : 'login';
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const name = String(body.name ?? '').trim().slice(0, 120);

  if (!email.includes('@') || email.length > 200) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    await ensureCustomersTable(sql);

    const key = attemptKey(request, email);

    const attempts = (await sql`
      SELECT COUNT(*)::int AS n FROM auth_attempts
      WHERE key = ${key} AND created_at > NOW() - make_interval(mins => ${RATE_WINDOW_MINUTES})
    `) as unknown as { n: number }[];

    if ((attempts[0]?.n ?? 0) >= RATE_MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    const rows = (await sql`
      SELECT id, email, name, password_hash FROM customers
      WHERE LOWER(email) = ${email} LIMIT 1
    `) as unknown as Row[];

    const existing = rows[0];

    /* ---------------- register ---------------- */

    if (mode === 'register') {
      const problem = passwordProblem(password);
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });

      if (existing) {
        // Their address, so telling them it is taken is not enumeration — but
        // steer rather than confirm a password exists.
        return NextResponse.json(
          { error: 'That email already has an account. Try signing in instead.' },
          { status: 409 }
        );
      }

      const hash = await hashPassword(password);
      await sql`
        INSERT INTO customers (email, name, password_hash)
        VALUES (${email}, ${name || null}, ${hash})
      `;

      const token = createSessionToken({
        sub: `email:${email}`,
        email,
        name: name || email.split('@')[0] || 'Customer',
      });
      if (!token) {
        return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
      }

      const response = NextResponse.json({ ok: true });
      response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
      return response;
    }

    /* ---------------- login ---------------- */

    await sql`INSERT INTO auth_attempts (key) VALUES (${key})`;

    // Identical response for "no such account", "Google-only account" and
    // "wrong password", after an identical delay.
    const deny = async () => {
      await wait(FAILURE_DELAY_MS);
      return NextResponse.json(
        { error: 'That email and password do not match.' },
        { status: 401 }
      );
    };

    if (!existing || !existing.password_hash) return deny();
    if (!(await verifyPassword(password, existing.password_hash))) return deny();

    const token = createSessionToken({
      sub: `email:${existing.email}`,
      email: existing.email,
      name: existing.name || existing.email.split('@')[0] || 'Customer',
    });
    if (!token) {
      return NextResponse.json({ error: 'Accounts are not configured.' }, { status: 503 });
    }

    // Clear the attempt counter on success so a legitimate customer who
    // fumbled a few times is not locked out afterwards.
    await sql`DELETE FROM auth_attempts WHERE key = ${key}`;
    await sql`UPDATE customers SET last_seen = NOW() WHERE id = ${existing.id}`;

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('[auth/password] failed:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
