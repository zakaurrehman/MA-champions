import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import SignOutButton from '@/components/account/SignOutButton';
import { getSessionUser, authConfigured } from '@/lib/session';
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
  created_at: string;
}

/** Orders are matched by email, so WhatsApp and crypto orders appear too. */
async function loadOrders(email: string): Promise<OrderRow[]> {
  const sql = db();
  if (!sql) return [];

  try {
    return (await sql`
      SELECT reference, status, items, subtotal, currency, tracking_number, created_at
      FROM orders
      WHERE LOWER(customer_email) = LOWER(${email})
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

        {authConfigured() ? (
          <a
            href="/api/auth/google"
            className="inline-flex items-center gap-3 rounded-[--radius-plate] border border-subtle/40 px-6 py-3.5 font-body text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-link"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M21.6 12.2c0-.6-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2Z" />
              <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
              <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z" />
            </svg>
            Continue with Google
          </a>
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

  const orders = await loadOrders(user.email);

  return (
    <PageShell eyebrow="Account" title={`Hello, ${user.name.split(' ')[0]}`} intro={user.email}>
      <div className="mb-10">
        <SignOutButton />
      </div>

      <h2 className="text-2xl text-ink">Your orders</h2>

      {orders.length === 0 ? (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          No orders against this email yet. If you ordered on WhatsApp with a different address,
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

              <p className="font-display text-xl text-plated">
                {formatPrice(Number(order.subtotal), order.currency)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
