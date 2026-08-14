import Link from 'next/link';
import { adminConfigured, isAdmin } from '@/lib/adminAuth';
import AdminLogin from './AdminLogin';
import AdminSignOut from './AdminSignOut';

const NAV = [
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/reviews', label: 'Reviews' },
] as const;

interface Props {
  title: string;
  intro?: string;
  /** Rendered to the right of the heading — "New belt", counts, etc. */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Auth gate plus chrome for every admin page.
 *
 * The gate lives here rather than in each page so a new admin route cannot
 * accidentally ship unprotected — forgetting to call isAdmin() in one file
 * would otherwise be a silent hole.
 */
export default async function AdminShell({ title, intro, action, children }: Props) {
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl text-ink">Admin</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          This area is for M.A Champions Belts staff.
        </p>
        <div className="mt-8">
          <AdminLogin configured={adminConfigured()} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[--radius-plate] px-3 py-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <AdminSignOut />
      </div>

      <div className="mt-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl text-ink">{title}</h1>
          {intro && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{intro}</p>}
        </div>
        {action}
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
