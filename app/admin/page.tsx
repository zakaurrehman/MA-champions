import type { Metadata } from 'next';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { isAdmin } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Dashboard — Admin',
  robots: { index: false, follow: false, nocache: true },
};

interface Stats {
  ordersOpen: number;
  ordersWeek: number;
  revenueWeek: number;
  paymentsAwaiting: number;
  reviewsPending: number;
  products: number;
  hidden: number;
}

/**
 * One query, not seven. Each count is a scalar subquery in a single round trip
 * — a dashboard that fires a request per tile is how admin pages get slow.
 */
async function loadStats(): Promise<Stats | null> {
  const sql = db();
  if (!sql) return null;

  try {
    const rows = (await sql`
      SELECT
        (SELECT COUNT(*)::int FROM orders
          WHERE status NOT IN ('completed','cancelled'))                       AS orders_open,
        (SELECT COUNT(*)::int FROM orders
          WHERE created_at > NOW() - INTERVAL '7 days')                        AS orders_week,
        (SELECT COALESCE(SUM(subtotal), 0)::float FROM orders
          WHERE created_at > NOW() - INTERVAL '7 days'
            AND status NOT IN ('cancelled'))                                   AS revenue_week,
        (SELECT COUNT(*)::int FROM orders
          WHERE payment_method = 'crypto' AND payment_verified = FALSE)        AS payments_awaiting,
        (SELECT COUNT(*)::int FROM reviews WHERE status = 'pending')           AS reviews_pending,
        (SELECT COUNT(*)::int FROM products)                                   AS products,
        (SELECT COUNT(*)::int FROM products WHERE shop_visible = FALSE)        AS hidden
    `) as unknown as Record<string, number>[];

    const r = rows[0];
    if (!r) return null;

    return {
      ordersOpen: r.orders_open ?? 0,
      ordersWeek: r.orders_week ?? 0,
      revenueWeek: r.revenue_week ?? 0,
      paymentsAwaiting: r.payments_awaiting ?? 0,
      reviewsPending: r.reviews_pending ?? 0,
      products: r.products ?? 0,
      hidden: r.hidden ?? 0,
    };
  } catch {
    // Tables not created yet — everything is legitimately zero.
    return null;
  }
}

function Tile({
  label,
  value,
  href,
  urgent = false,
}: {
  label: string;
  value: string;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-[--radius-plate] border p-5 transition-colors hover:border-primary ${
        urgent ? 'border-primary/50' : 'border-line'
      }`}
    >
      <p className="font-body text-2xs font-semibold uppercase tracking-[0.18em] text-subtle">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl ${urgent ? 'text-plated' : 'text-ink'}`}>
        {value}
      </p>
    </Link>
  );
}

export default async function AdminDashboard() {
  const stats = (await isAdmin()) ? await loadStats() : null;

  return (
    <AdminShell
      title="Dashboard"
      intro={
        stats
          ? 'Anything needing attention is highlighted.'
          : 'Connect a database and import your catalogue to see figures here.'
      }
    >
      {!stats ? (
        <p className="text-sm leading-relaxed text-muted">
          No figures yet. Once your catalogue is imported and the first order arrives, this page
          shows what needs doing.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Tile
              label="Orders to action"
              value={String(stats.ordersOpen)}
              href="/admin/orders"
              urgent={stats.ordersOpen > 0}
            />
            <Tile
              label="Crypto payments to verify"
              value={String(stats.paymentsAwaiting)}
              href="/admin/orders"
              urgent={stats.paymentsAwaiting > 0}
            />
            <Tile
              label="Reviews to moderate"
              value={String(stats.reviewsPending)}
              href="/admin/reviews"
              urgent={stats.reviewsPending > 0}
            />
            <Tile label="Orders this week" value={String(stats.ordersWeek)} href="/admin/orders" />
            <Tile
              label="Value this week"
              value={formatPrice(stats.revenueWeek)}
              href="/admin/orders"
            />
            <Tile
              label="Belts in catalogue"
              value={stats.hidden > 0 ? `${stats.products} (${stats.hidden} hidden)` : String(stats.products)}
              href="/admin/products"
            />
          </div>

          <p className="mt-6 text-2xs leading-relaxed text-muted">
            &ldquo;Value this week&rdquo; totals order intents, not confirmed payments. Someone
            reaching the WhatsApp handoff is counted here even if they never sent the message.
          </p>
        </>
      )}
    </AdminShell>
  );
}
