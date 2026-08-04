import Image from 'next/image';
import Link from 'next/link';
import SectionHeading from '@/components/ui/SectionHeading';
import { getPosts } from '@/lib/blog';

/**
 * Latest three posts. Renders nothing while the blog is empty — an empty
 * "from the blog" strip on a homepage reads as an unfinished site.
 */
export default async function BlogTeasers() {
  const posts = await getPosts(3);
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-ink-line py-16 sm:py-20" aria-labelledby="blog-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Journal"
          title="From the workshop"
          titleId="blog-title"
          action={
            <Link
              href="/blog"
              className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-hi"
            >
              All posts →
            </Link>
          }
        />

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                {post.cover && (
                  <div className="border-plate relative aspect-[16/10] overflow-hidden rounded-[--radius-plate] bg-ink-raised">
                    <Image
                      src={post.cover.src}
                      alt={post.cover.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <p className="mt-4 text-2xs uppercase tracking-[0.16em] text-nickel">
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
                <h3 className="mt-2 font-body text-base font-semibold leading-snug text-bone transition-colors group-hover:text-gold-hi">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-bone-dim">{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
