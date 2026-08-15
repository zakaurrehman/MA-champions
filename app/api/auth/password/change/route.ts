import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureCustomersTable, ensurePasswordResetsTable } from '@/lib/db-schema';
import { hashPassword, verifyPassword, passwordProblem } from '@/lib/password';
import { getSessionUser } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Change a customer's password, or set one for the first time.
 *
 * Someone who signed in with Google has no password yet. They are already
 * authenticated, so they may set one without confirming a current password —
 * demanding one they have never had would make the feature impossible. Once a
 * password exists, the current one is always required: a session alone must not
 * be enough to lock the real owner out.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const sql = db();
  if (!sql) {
    return NextResponse.json({ error: 'Accounts are unavailable right now.' }, { status: 503 });
  }

  let currentPassword = '';
  let newPassword = '';
  try {
    const body = (await request.json()) as { currentPassword?: unknown; newPassword?: unknown };
    currentPassword = String(body.currentPassword ?? '');
    newPassword = String(body.newPassword ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const problem = passwordProblem(newPassword);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  try {
    await ensureCustomersTable(sql);
    await ensurePasswordResetsTable(sql);

    const rows = (await sql`
      SELECT id, password_hash FROM customers WHERE LOWER(email) = LOWER(${user.email}) LIMIT 1
    `) as unknown as { id: number; password_hash: string | null }[];

    const existing = rows[0];
    if (!existing) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    if (existing.password_hash) {
      if (!(await verifyPassword(currentPassword, existing.password_hash))) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
      }
      if (currentPassword === newPassword) {
        return NextResponse.json({ error: 'That is your current password.' }, { status: 400 });
      }
    }

    const hash = await hashPassword(newPassword);
    await sql`UPDATE customers SET password_hash = ${hash} WHERE id = ${existing.id}`;

    /*
     * Any outstanding reset links for this address are now stale. Burning them
     * closes the window where an old emailed link could still take the account
     * back off its owner.
     */
    await sql`
      UPDATE password_resets SET used_at = NOW()
      WHERE LOWER(email) = LOWER(${user.email}) AND used_at IS NULL
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[auth/password/change] failed:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
