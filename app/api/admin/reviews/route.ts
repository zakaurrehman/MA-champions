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

type StatusAction = keyof typeof ACTIONS;
type Action = StatusAction | 'delete' | 'removePhoto';

/** Narrows to the status transitions, so ACTIONS is only ever indexed by one. */
const isStatusAction = (value: Action): value is StatusAction => value in ACTIONS;

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

  let body: { id?: unknown; action?: unknown; verified?: unknown; photo?: unknown };
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
  /*
   * Deleting and removing a single photo are not status changes, so they are
   * handled before the status whitelist below rather than folded into it.
   */
  if (action === 'delete') {
    try {
      await sql`DELETE FROM reviews WHERE id = ${id}`;
      return NextResponse.json({ ok: true, id, deleted: true });
    } catch (error) {
      console.error('[api/admin/reviews] delete failed:', error);
      return NextResponse.json({ error: 'Delete failed.' }, { status: 500 });
    }
  }

  if (action === 'removePhoto') {
    const photo = typeof body.photo === 'string' ? body.photo : '';
    if (!photo) {
      return NextResponse.json({ error: 'No photo specified.' }, { status: 400 });
    }
    try {
      /*
       * Filters the URL out of the JSONB array in one statement. The blob
       * itself is left in storage deliberately: deleting it would break any
       * copy already cached elsewhere, and an unreferenced blob is invisible
       * to customers because the site only ever renders this array.
       */
      await sql`
        UPDATE reviews
        SET photos = COALESCE(
              (SELECT jsonb_agg(value)
                 FROM jsonb_array_elements(photos) AS value
                WHERE value <> to_jsonb(${photo}::text)),
              '[]'::jsonb
            ),
            updated_at = NOW()
        WHERE id = ${id}
      `;
      return NextResponse.json({ ok: true, id, removed: photo });
    } catch (error) {
      console.error('[api/admin/reviews] photo removal failed:', error);
      return NextResponse.json({ error: 'Could not remove the photo.' }, { status: 500 });
    }
  }

  // Whitelist, so `action` can never reach the query as arbitrary text.
  if (!isStatusAction(action)) {
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
