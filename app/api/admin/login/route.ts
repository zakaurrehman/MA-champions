import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { ensureAuthAttemptsTable } from '@/lib/db-schema';
import {
  ADMIN_COOKIE,
  adminConfigured,
  adminCookieOptions,
  checkCredentials,
  createAdminSession,
} from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Slows brute force even when the database is unreachable. */
const FAILURE_DELAY_MS = 750;
const RATE_WINDOW_MINUTES = 15;
const RATE_MAX_ATTEMPTS = 8;

function attemptKey(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return `admin:${createHash('sha256').update(ip).digest('hex').slice(0, 24)}`;
}

/**
 * Counts recent failures and records this attempt. Returns true when the
 * caller has already used up its allowance.
 *
 * Failures here are swallowed: a database problem must not lock the operator
 * out of their own panel. The fixed delay above is the floor that always
 * applies.
 */
async function rateLimited(key: string): Promise<boolean> {
  const sql = db();
  if (!sql) return false;

  try {
    await ensureAuthAttemptsTable(sql);
    const rows = (await sql`
      SELECT COUNT(*)::int AS n FROM auth_attempts
      WHERE key = ${key} AND created_at > NOW() - make_interval(mins => ${RATE_WINDOW_MINUTES})
    `) as unknown as { n: number }[];
    return (rows[0]?.n ?? 0) >= RATE_MAX_ATTEMPTS;
  } catch {
    return false;
  }
}

async function recordFailure(key: string): Promise<void> {
  const sql = db();
  if (!sql) return;
  try {
    await sql`INSERT INTO auth_attempts (key) VALUES (${key})`;
  } catch {
    /* best effort */
  }
}

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: 'Admin access is not configured on this deployment.' },
      { status: 503 }
    );
  }

  let username = '';
  let password = '';
  try {
    const body = (await request.json()) as { username?: unknown; password?: unknown };
    username = String(body.username ?? '');
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const key = attemptKey(request);

  if (await rateLimited(key)) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait 15 minutes and try again.' },
      { status: 429 }
    );
  }

  if (!checkCredentials(username, password)) {
    await recordFailure(key);
    // A uniform delay on every failure, so a wrong password cannot be told
    // apart from a wrong username by response time.
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    return NextResponse.json({ error: 'Incorrect username or password.' }, { status: 401 });
  }

  const session = createAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });
  }

  // Clear the counter so a successful sign-in after a few typos does not leave
  // the operator near the limit.
  const sql = db();
  if (sql) {
    try {
      await sql`DELETE FROM auth_attempts WHERE key = ${key}`;
    } catch {
      /* best effort */
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, session, adminCookieOptions);
  return response;
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
