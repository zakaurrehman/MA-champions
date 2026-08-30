import type { Metadata } from 'next';
import ReviewRow, { type AdminReview } from '@/components/admin/ReviewRow';
import AdminShell from '@/components/admin/AdminShell';
import { isAdmin } from '@/lib/adminAuth';
import { db } from '@/lib/db';
import { reviewsTableExists } from '@/lib/db-schema';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review moderation',
  // Belt and braces: excluded in next-sitemap.config.js too.
  robots: { index: false, follow: false, nocache: true },
};

interface Row {
  id: number;
  product_slug: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  status: AdminReview['status'];
  verified: boolean;
  photos: unknown;
  created_at: string;
}

async function loadReviews(): Promise<AdminReview[] | null> {
  const sql = db();
  if (!sql) return null;

  if (!(await reviewsTableExists(sql))) return [];

  const rows = (await sql`
    SELECT id, product_slug, author_name, rating, title, body, status, verified, photos, created_at
    FROM reviews
    -- Pending first: this page exists to clear a queue.
    ORDER BY (status = 'pending') DESC, created_at DESC
    LIMIT 200
  `) as unknown as Row[];

  return rows.map((r) => ({
    id: Number(r.id),
    productSlug: r.product_slug,
    authorName: r.author_name,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status,
    verified: r.verified,
    photos: Array.isArray(r.photos) ? (r.photos as string[]) : [],
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export default async function AdminReviewsPage() {
  // AdminShell owns the auth gate and the nav, so this page cannot ship
  // unprotected and the two admin sections stay navigable from each other.
  const reviews = (await isAdmin()) ? await loadReviews() : [];

  if (reviews === null) {
    return (
      <AdminShell title="Reviews">
        <p className="text-sm text-muted">No database is configured on this deployment.</p>
      </AdminShell>
    );
  }

  const pending = reviews.filter((r) => r.status === 'pending');
  const rest = reviews.filter((r) => r.status !== 'pending');

  return (
    <AdminShell
      title="Reviews"
      intro={
        pending.length > 0
          ? `${pending.length} review${pending.length === 1 ? '' : 's'} waiting for you.`
          : 'Nothing waiting. Published reviews are listed below.'
      }
    >
      {reviews.length === 0 ? (
        <p className="mt-8 text-sm leading-relaxed text-muted">
          No reviews have been submitted yet.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {pending.length > 0 && (
            <section aria-labelledby="pending-h">
              <h2 id="pending-h" className="text-xl text-ink">
                Waiting for approval
              </h2>
              <ul className="mt-5 flex flex-col gap-4">
                {pending.map((r) => (
                  <ReviewRow key={r.id} review={r} />
                ))}
              </ul>
            </section>
          )}

          {rest.length > 0 && (
            <section aria-labelledby="rest-h">
              <h2 id="rest-h" className="text-xl text-ink">
                Already moderated
              </h2>
              <ul className="mt-5 flex flex-col gap-4">
                {rest.map((r) => (
                  <ReviewRow key={r.id} review={r} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </AdminShell>
  );
}
