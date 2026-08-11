import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIONS = {
  approve: 'approved',
  reject: 'rejected',
  unpublish: 'pending',
} as const;

type Action = keyof typeof ACTIONS;

/** Moderate one review. Requires a valid admin cookie. */
export async function POST(request: Request) {
  // Checked first, before reading the body, so an unauthorised caller learns
  // nothing about what the endpoint accepts.
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const sql = db();
  if (!sql) {
    return NextResponse.json({ error: 'No database configured.' }, { status: 503 });
  }

  let body: { id?: unknown; action?: unknown; verified?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const id = Number(body.id);
  const action = body.action as Action;

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: 'Invalid review id.' }, { status: 400 });
  }
  // Whitelist, so `action` can never reach the query as arbitrary text.
  if (!(action in ACTIONS)) {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  try {
    const status = ACTIONS[action];

    if (typeof body.verified === 'boolean') {
      await sql`
        UPDATE reviews
        SET status = ${status}, verified = ${body.verified}, updated_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE reviews SET status = ${status}, updated_at = NOW() WHERE id = ${id}
      `;
    }

    return NextResponse.json({ ok: true, id, status });
  } catch (error) {
    console.error('[api/admin/reviews] update failed:', error);
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}
