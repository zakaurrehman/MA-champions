import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import SignOutButton from '@/components/account/SignOutButton';
import AuthForm from '@/components/account/AuthForm';
import PasswordChangeForm from '@/components/ui/PasswordChangeForm';
import { getSessionUser, sessionConfigured, googleConfigured } from '@/lib/session';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your Account',
  robots: { index: false, follow: false },
};

interface OrderRow {
  reference: string;
  status: string;
  items: { name: string; quantity: number; variantName: string | null }[];
  subtotal: string | number;
  currency: string;
  tracking_number: string | null;
  payment_method: string | null;
  payment_verified: boolean;
  created_at: string;
}

/** The phone on the account, used to match guest orders placed with it. */
async function accountPhone(email: string): Promise<string | null> {
  const sql = db();
  if (!sql) return null;

  try {
    const rows = (await sql`
      SELECT phone FROM customers WHERE LOWER(email) = LOWER(${email}) LIMIT 1
    `) as unknown as { phone: string | null }[];
    return rows[0]?.phone ?? null;
  } catch {
    return null;
  }
}

/**
 * Whether this account already has a password. A Google customer does not, so
 * they are offered "Set a password" with no current-password field — asking
 * them to confirm one they have never had would make it impossible to add one.
 */
async function hasPassword(email: string): Promise<boolean> {
  const sql = db();
  if (!sql) return false;

  try {
    const rows = (await sql`
      SELECT password_hash FROM customers WHERE LOWER(email) = LOWER(${email}) LIMIT 1
    `) as unknown as { password_hash: string | null }[];
    return Boolean(rows[0]?.password_hash);
  } catch {
    return false;
  }
}

/**
 * Every order belonging to this person, however they placed it.
 *
 * This is the account-linking mechanism, and it works by matching rather than
 * by writing a foreign key at signup. That choice matters: a guest order
 * placed BEFORE the account existed is picked up automatically, and so is one
 * placed after, on WhatsApp, without signing in. There is no migration step to
 * forget to run and no chance of duplicating an order into a second table.
 *
 * Matched on email, or on phone when the account has one. Phones are compared
 * on their last nine digits because +92 302 405 7417 and 03024057417 are the
 * same person, and a literal comparison would hide their own order from them.
 */
async function loadOrders(email: string, phone: string | null): Promise<OrderRow[]> {
  const sql = db();
  if (!sql) return [];

  const phoneTail = (phone ?? '').replace(/\D/g, '').slice(-9);

  try {
    return (await sql`
      SELECT reference, status, items, subtotal, currency, tracking_number,
             payment_method, payment_verified, created_at
      FROM orders
      WHERE LOWER(customer_email) = LOWER(${email})
         OR (
              ${phoneTail} <> ''
              AND LENGTH(regexp_replace(COALESCE(customer_phone, ''), '\\D', '', 'g')) >= 9
              AND RIGHT(regexp_replace(COALESCE(customer_phone, ''), '\\D', '', 'g'), 9) = ${phoneTail}
            )
      ORDER BY created_at DESC
      LIMIT 50
    `) as unknown as OrderRow[];
  } catch {
    return [];
  }
}

const ERRORS: Record<string, string> = {
  'not-configured': 'Sign-in is not switched on yet. Please order as a guest.',
  cancelled: 'Sign-in was cancelled.',
  expired: 'That took too long — please try again.',
  'state-mismatch': 'Sign-in could not be verified. Please try again.',
  'unverified-email': 'Your Google email is not verified.',
  token: 'Google could not confirm your identity. Please try again.',
  invalid: 'Something went wrong. Please try again.',
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getSessionUser();

  if (!user) {
    return (
      <PageShell
        eyebrow="Account"
        title="Your account"
        intro="Sign in to see your order history in one place. You never need an account to buy — guest checkout is always available."
      >
        {error && ERRORS[error] && (
          <p role="alert" className="mb-6 max-w-md text-sm text-link">
            {ERRORS[error]}
          </p>
        )}

        {sessionConfigured() ? (
          <>
            <AuthForm googleEnabled={googleConfigured()} />
            <p className="mt-8 max-w-md text-2xs leading-relaxed text-muted">
              Ordered on WhatsApp and have no account? Look your order up with its reference on
              the{' '}
              <Link href="/track-order" className="text-link hover:underline">
                track order page
              </Link>
              .
            </p>
          </>
        ) : (
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Accounts are not switched on yet. You can still track any order using its reference
            on the{' '}
            <Link href="/track-order" className="text-link hover:underline">
              track order page
            </Link>
            .
          </p>
        )}
      </PageShell>
    );
  }

  const phone = await accountPhone(user.email);
  const [orders, passwordSet] = await Promise.all([
    loadOrders(user.email, phone),
    hasPassword(user.email),
  ]);

  return (
    <PageShell eyebrow="Account" title={`Hello, ${user.name.split(' ')[0]}`} intro={user.email}>
      <div className="mb-10">
        <SignOutButton />
      </div>

      <section className="mb-12 rounded-[--radius-plate] border border-line p-6">
        <h2 className="text-2xl text-ink">
          {passwordSet ? 'Change your password' : 'Set a password'}
        </h2>
        <p className="mt-2 mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          {passwordSet
            ? 'Choose something you do not use on other sites.'
            : 'You signed in with Google. Add a password if you would also like to sign in without it.'}
        </p>
        <PasswordChangeForm
          endpoint="/api/auth/password/change"
          requireCurrent={passwordSet}
          submitLabel={passwordSet ? 'Change password' : 'Set password'}
        />
      </section>

      <h2 className="text-2xl text-ink">Your orders</h2>

      {orders.length === 0 ? (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          No orders yet against this email or phone. If you ordered with a different address,
          look it up with your reference on the{' '}
          <Link href="/track-order" className="text-link hover:underline">
            track order page
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((order) => (
            <li
              key={order.reference}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[--radius-plate] border border-line p-5"
            >
              <div className="min-w-0">
                <p className="font-display text-lg text-ink">{order.reference}</p>
                <p className="mt-1 text-2xs uppercase tracking-[0.14em] text-subtle">
                  {order.status}
                  {order.payment_method &&
                    ` · ${order.payment_method}${order.payment_verified ? ' received' : ' awaiting confirmation'}`}
                  {order.tracking_number && ` · ${order.tracking_number}`}
                  {' · '}
                  <time dateTime={order.created_at}>
                    {new Date(order.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                </p>
                <p className="mt-2 text-sm text-muted">
                  {(order.items ?? [])
                    .map((i) => `${i.quantity} × ${i.name}${i.variantName ? ` (${i.variantName})` : ''}`)
                    .join(', ')}
                </p>
              </div>

              <div className="text-right">
                <p className="font-display text-xl text-plated">
                  {formatPrice(Number(order.subtotal), order.currency)}
                </p>
                <Link
                  href={`/order-confirmation?ref=${order.reference}`}
                  className="mt-1 inline-block font-body text-2xs font-semibold uppercase tracking-[0.14em] text-link hover:underline"
                >
                  View order
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
