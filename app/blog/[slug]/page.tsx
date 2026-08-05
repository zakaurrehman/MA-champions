import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getPostBySlug, getPosts } from '@/lib/blog';
import { site } from '@/lib/site';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      images: post.cover ? [{ url: post.cover.src, alt: post.cover.alt }] : undefined,
    },
  };
}

/**
 * MDX element mapping.
 *
 * Posts are written as plain markdown, so every element needs a style here —
 * without this the prose inherits nothing and renders as an unstyled wall.
 */
const components = {
  h2: (p: React.ComponentProps<'h2'>) => (
    <h2 className="mt-12 text-2xl text-ink sm:text-3xl" {...p} />
  ),
  h3: (p: React.ComponentProps<'h3'>) => <h3 className="mt-9 text-xl text-ink" {...p} />,
  p: (p: React.ComponentProps<'p'>) => (
    <p className="mt-5 text-base leading-relaxed text-muted" {...p} />
  ),
  ul: (p: React.ComponentProps<'ul'>) => (
    <ul className="mt-5 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-muted" {...p} />
  ),
  ol: (p: React.ComponentProps<'ol'>) => (
    <ol className="mt-5 flex list-decimal flex-col gap-2 pl-5 text-base leading-relaxed text-muted" {...p} />
  ),
  strong: (p: React.ComponentProps<'strong'>) => (
    <strong className="font-semibold text-ink" {...p} />
  ),
  a: (p: React.ComponentProps<'a'>) => (
    <a className="text-link underline-offset-4 hover:underline" {...p} />
  ),
  table: (p: React.ComponentProps<'table'>) => (
    <div className="mt-7 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" {...p} />
    </div>
  ),
  th: (p: React.ComponentProps<'th'>) => (
    <th
      className="border-b border-line pb-3 pr-6 font-body text-2xs font-semibold uppercase tracking-[0.14em] text-subtle"
      {...p}
    />
  ),
  td: (p: React.ComponentProps<'td'>) => (
    <td className="border-b border-line/60 py-3 pr-6 text-muted" {...p} />
  ),
  blockquote: (p: React.ComponentProps<'blockquote'>) => (
    <blockquote className="mt-6 border-l-2 border-primary pl-5 text-base italic leading-relaxed text-muted" {...p} />
  ),
};

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/blog"
          className="text-2xs uppercase tracking-[0.14em] text-subtle hover:text-link"
        >
          ← Journal
        </Link>
      </nav>

      <header>
        <p className="text-2xs uppercase tracking-[0.16em] text-subtle">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
          {' · '}
          {post.readingMinutes} min read
        </p>
        <h1 className="mt-4 text-4xl leading-[0.95] text-ink sm:text-5xl">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-5 text-lg leading-relaxed text-muted">{post.excerpt}</p>
        )}
      </header>

      {post.cover && (
        <div className="border-plate relative mt-10 aspect-[16/9] overflow-hidden rounded-[--radius-plate] bg-surface">
          <Image
            src={post.cover.src}
            alt={post.cover.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-10">
        {/*
          remark-gfm is required, not optional: without it markdown tables,
          strikethrough and task lists render as literal pipe characters. SEO
          posts lean heavily on comparison tables, so this would have shipped
          visibly broken content.
        */}
        <MDXRemote
          source={post.content}
          components={components}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </div>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          dateModified: post.date,
          mainEntityOfPage: `${site.url}/blog/${post.slug}`,
          author: { '@id': `${site.url}/#organization` },
          publisher: { '@id': `${site.url}/#organization` },
          ...(post.cover && { image: `${site.url}${post.cover.src}` }),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Journal', path: '/blog' },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />
    </article>
  );
}
