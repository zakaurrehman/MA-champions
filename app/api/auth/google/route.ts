import { NextResponse } from 'next/server';
import { googleConfigured, randomToken, OAUTH_STATE_COOKIE } from '@/lib/session';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Starts the Google sign-in redirect. */
export async function GET(request: Request) {
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL('/account?error=not-configured', site.url));
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') ?? '/account';

  /*
   * CSRF protection. The state is generated here, stored in a short-lived
   * httpOnly cookie, and must come back unchanged from Google — otherwise an
   * attacker could feed us their own authorisation code and sign a victim into
   * the attacker's account.
   */
  const state = randomToken();

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', `${site.url}/api/auth/callback/google`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  // We only need identity, so never ask for a refresh token or offline access.
  authUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(authUrl);

  response.cookies.set(OAUTH_STATE_COOKIE, `${state}|${returnTo}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });

  return response;
}
