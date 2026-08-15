import type { Metadata } from 'next';
import AdminShell from '@/components/admin/AdminShell';
import ResetLinkIssuer from '@/components/admin/ResetLinkIssuer';
import PasswordChangeForm from '@/components/ui/PasswordChangeForm';
import { MIN_ADMIN_PASSWORD_LENGTH, adminCredentials, isAdmin } from '@/lib/adminAuth';
import { emailConfigured } from '@/lib/email';
import { db } from '@/lib/db';
import { ensurePasswordResetsTable } from '@/lib/db-schema';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Settings — Admin',
  robots: { index: false, follow: false, nocache: true },
};

interface PendingReset {
  email: string;
  created_at: string;
}

/** Customers who asked for a link we could not email. */
async function loadPending(): Promise<PendingReset[]> {
  const sql = db();
  if (!sql) return [];

  try {
    await ensurePasswordResetsTable(sql);
    return (await sql`
      SELECT DISTINCT ON (LOWER(email)) email, created_at
      FROM password_resets
      WHERE used_at IS NULL AND delivered = FALSE AND expires_at > NOW()
      ORDER BY LOWER(email), created_at DESC
      LIMIT 25
    `) as unknown as PendingReset[];
  } catch {
    return [];
  }
}

export default async function AdminSettings() {
  const signedIn = await isAdmin();
  const [creds, pending] = signedIn
    ? await Promise.all([adminCredentials(), loadPending()])
    : [null, []];

  return (
    <AdminShell title="Settings" intro="Your sign-in details, and help for locked-out customers.">
      <section>
        <h2 className="text-2xl text-ink">Change your password</h2>
        <p className="mt-2 mb-6 max-w-2xl text-sm leading-relaxed text-muted">
          Signed in as <strong className="text-ink">{creds?.username ?? 'admin'}</strong>. Changing
          this signs out every other device immediately.
        </p>

        <PasswordChangeForm
          endpoint="/api/admin/password"
          minLength={MIN_ADMIN_PASSWORD_LENGTH}
          afterNote={
            creds && !creds.managed ? (
              <>
                Your password is now stored in the database. Go to your hosting environment and{' '}
                <strong className="text-ink">delete ADMIN_PASSWORD and ADMIN_TOKEN</strong> — until
                you do, the old one still works as a fallback.
              </>
            ) : (
              'Every other signed-in device has been signed out.'
            )
          }
        />
      </section>

      <section className="mt-14 border-t border-line pt-10">
        <h2 className="text-2xl text-ink">Customer password resets</h2>

        {emailConfigured() ? (
          <p className="mt-2 mb-6 max-w-2xl text-sm leading-relaxed text-muted">
            Reset emails are sending automatically. You can still create a link here if a customer
            says nothing arrived.
          </p>
        ) : (
          <p className="mt-2 mb-6 max-w-2xl text-sm leading-relaxed text-muted">
            No email service is connected, so reset links are <strong>not</strong> being sent
            automatically. Create one here and send it over WhatsApp. To automate this, add{' '}
            <code className="text-ink">RESEND_API_KEY</code> and{' '}
            <code className="text-ink">EMAIL_FROM</code> to your hosting environment.
          </p>
        )}

        {pending.length > 0 && (
          <div className="mb-8 rounded-[--radius-plate] border border-primary/50 p-5">
            <p className="font-body text-2xs font-semibold uppercase tracking-[0.16em] text-link">
              {pending.length} waiting for a link
            </p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {pending.map((row) => (
                <li key={row.email} className="font-body text-sm text-ink">
                  {row.email}
                  <span className="ml-2 text-2xs text-muted">
                    <time dateTime={row.created_at}>
                      {new Date(row.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ResetLinkIssuer presetEmail={pending[0]?.email ?? ''} />
      </section>
    </AdminShell>
  );
}
