import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  ADMIN_COOKIE,
  MIN_ADMIN_PASSWORD_LENGTH,
  adminCookieOptions,
  adminCredentials,
  checkCredentials,
  createSessionForKey,
  isAdmin,
  setAdminPassword,
} from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Changes the admin password.
 *
 * Being signed in is not enough on its own — the current password is required
 * too. That is what stops someone who walks up to an unlocked laptop from
 * locking the real operator out of their own shop.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  if (!db()) {
    return NextResponse.json(
      {
        error:
          'No database connected, so the password can only be changed in your hosting environment.',
      },
      { status: 503 }
    );
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

  const creds = await adminCredentials();
  if (!creds) {
    return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });
  }

  if (!(await checkCredentials(creds.username, currentPassword))) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  if (newPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Use at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }
  if (newPassword.length > 200) {
    return NextResponse.json({ error: 'That password is too long.' }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: 'That is your current password.' }, { status: 400 });
  }

  let newKey: string | null;
  try {
    newKey = await setAdminPassword(creds.username, newPassword);
  } catch (error) {
    console.error('[admin/password] save failed:', error);
    return NextResponse.json({ error: 'Could not save the new password.' }, { status: 500 });
  }

  if (!newKey) {
    return NextResponse.json({ error: 'Could not save the new password.' }, { status: 503 });
  }

  /*
   * Sessions are signed with the password, so that change just invalidated
   * this one too. Re-sign with the NEW key so the operator is not thrown out
   * of the panel by their own successful password change — and so every other
   * device stays signed out, which is the point of changing it.
   */
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionForKey(newKey), adminCookieOptions);
  return response;
}
