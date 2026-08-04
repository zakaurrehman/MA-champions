import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import EmptyState from '@/components/ui/EmptyState';
import { getPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Journal — Championship Belt Guides & Workshop Notes',
  description:
    'Guides on championship belt materials, plating, sizing and custom design, from the M.A Champions Belts workshop.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <PageShell
      eyebrow="Journal"
      title="From the workshop"
      intro="Guides on materials, plating, sizing and the custom process — written by the people who make the belts."
    >
      {posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          body="The first guides are being written. In the meantime, the Belt Builder answers most of the questions these posts will cover."
        />
      ) : (
        <ul className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                {post.cover && (
                  <div className="border-plate relative aspect-[16/10] overflow-hidden rounded-[--radius-plate] bg-surface">
                    <Image
                      src={post.cover.src}
                      alt={post.cover.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <p className="mt-4 text-2xs uppercase tracking-[0.16em] text-subtle">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                  {' · '}
                  {post.readingMinutes} min read
                </p>
                <h2 className="mt-2 font-body text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-link">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
