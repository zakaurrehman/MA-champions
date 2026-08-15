import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { ensureCustomersTable } from '@/lib/db-schema';
import {
  googleConfigured,
  createSessionToken,
  sessionCookieOptions,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
} from '@/lib/session';
import { site } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TokenResponse {
  id_token?: string;
  error?: string;
}

interface IdTokenClaims {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

const fail = (reason: string) =>
  NextResponse.redirect(new URL(`/account?error=${reason}`, site.url));

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(request: Request) {
  if (!googleConfigured()) return fail('not-configured');

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (url.searchParams.get('error')) return fail('cancelled');
  if (!code || !state) return fail('invalid');

  // The state cookie must match what Google returned, or this is not our flow.
  const stored = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.slice(OAUTH_STATE_COOKIE.length + 1);

  if (!stored) return fail('expired');

  const [storedState, returnTo = '/account'] = decodeURIComponent(stored).split('|');
  if (!storedState || !safeEqual(storedState, state)) return fail('state-mismatch');

  /* ---- exchange the code for an id token ---- */

  let claims: IdTokenClaims;
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${site.url}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    });

    const data = (await res.json()) as TokenResponse;
    if (!res.ok || !data.id_token) return fail('token');

    /*
     * The id_token's signature is not re-verified here, and that is correct
     * for this flow: it arrived over TLS directly from Google's token endpoint
     * in response to a request authenticated with our client secret. There is
     * no untrusted party in between. Signature verification matters when a
     * token is handed to you by the browser — never do that.
     */
    const [, payload] = data.id_token.split('.');
    if (!payload) return fail('token');
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as IdTokenClaims;
  } catch {
    return fail('token');
  }

  if (!claims.sub || !claims.email) return fail('token');
  // An unverified address could belong to someone else entirely.
  if (claims.email_verified === false) return fail('unverified-email');

  /* ---- upsert the customer ---- */

  const sql = db();
  if (sql) {
    try {
      await ensureCustomersTable(sql);

      /*
       * Match on the Google id *or* the email address, because the same person
       * can arrive both ways: sign up with a password on Monday, click
       * "Continue with Google" on Tuesday. Matching on google_sub alone would
       * try to insert a second row and collide with the unique email index.
       *
       * COALESCE, so an account that already has a google_sub keeps it.
       */
      const linked = (await sql`
        UPDATE customers SET
          google_sub = COALESCE(google_sub, ${claims.sub}),
          name       = COALESCE(name, ${claims.name ?? null}),
          picture    = ${claims.picture ?? null},
          last_seen  = NOW()
        WHERE google_sub = ${claims.sub} OR LOWER(email) = LOWER(${claims.email})
        RETURNING id
      `) as unknown as { id: number }[];

      if (linked.length === 0) {
        await sql`
          INSERT INTO customers (google_sub, email, name, picture)
          VALUES (${claims.sub}, ${claims.email}, ${claims.name ?? null}, ${claims.picture ?? null})
        `;
      }
    } catch (error) {
      // Sign-in still succeeds: the session is self-contained and the customer
      // should not be locked out because our bookkeeping failed.
      console.error('[auth/callback] customer upsert failed:', error);
    }
  }

  const token = createSessionToken({
    sub: claims.sub,
    email: claims.email,
    name: claims.name ?? claims.email.split('@')[0] ?? 'Customer',
    picture: claims.picture,
  });

  if (!token) return fail('not-configured');

  // Only ever redirect to a path on this site — an absolute URL here would be
  // an open redirect.
  const safeReturn = returnTo.startsWith('/') ? returnTo : '/account';
  const response = NextResponse.redirect(new URL(safeReturn, site.url));

  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  response.cookies.delete(OAUTH_STATE_COOKIE);

  return response;
}
