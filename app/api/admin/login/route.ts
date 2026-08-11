import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminConfigured, isValidToken } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Slows brute force without needing shared state across serverless invocations. */
const FAILURE_DELAY_MS = 750;

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: 'Admin access is not configured on this deployment.' },
      { status: 503 }
    );
  }

  let token: string | undefined;
  try {
    token = (await request.json())?.token;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!isValidToken(token)) {
    // A uniform delay on every failure, so a wrong token cannot be
    // distinguished from a malformed one by response time.
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    return NextResponse.json({ error: 'Incorrect token.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(ADMIN_COOKIE, token!, {
    httpOnly: true, // never readable by client JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // not sent on cross-site requests, so no CSRF
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return response;
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
