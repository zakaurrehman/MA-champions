/**
 * Blog posts, read from `content/blog/*.mdx` at build time.
 *
 * To publish a post: drop a `.mdx` file in that folder with frontmatter. No
 * code changes, no rebuild config, no CMS. A post with `draft: true` is
 * ignored, so drafts can live in the repo safely.
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingMinutes: number;
  cover?: { src: string; alt: string };
  tags: string[];
  /** Raw MDX body, rendered by the [slug] route. */
  content: string;
}

const WORDS_PER_MINUTE = 210;

function parseFile(filename: string): BlogPost | null {
  const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8');
  const { data, content } = matter(raw);

  if (data.draft === true) return null;
  if (!data.title || !data.date) return null;

  const words = content.trim().split(/\s+/).length;

  return {
    slug: data.slug || filename.replace(/\.mdx$/, ''),
    title: String(data.title),
    excerpt: String(data.excerpt ?? ''),
    date: new Date(data.date).toISOString().slice(0, 10),
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    cover: data.cover?.src ? { src: data.cover.src, alt: data.cover.alt ?? '' } : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    content,
  };
}

function loadPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map(parseFile)
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPosts(limit?: number): Promise<BlogPost[]> {
  const all = loadPosts();
  return limit ? all.slice(0, limit) : all;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  return loadPosts().find((p) => p.slug === slug) ?? null;
}
