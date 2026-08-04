/**
 * Blog access.
 *
 * Phase 4 replaces this with MDX files read from `content/blog/*.mdx`. The
 * signatures below are the contract that migration must keep, so components
 * written now will not change.
 *
 * There are no posts yet, so every blog surface renders nothing rather than
 * showing invented articles.
 */

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingMinutes: number;
  cover?: { src: string; alt: string };
  tags: string[];
}

// TODO (Phase 4): read from content/blog/*.mdx via next-mdx-remote or @next/mdx.
async function loadPosts(): Promise<BlogPost[]> {
  return [];
}

export async function getPosts(limit?: number): Promise<BlogPost[]> {
  const all = await loadPosts();
  const sorted = all.slice().sort((a, b) => b.date.localeCompare(a.date));
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const all = await loadPosts();
  return all.find((p) => p.slug === slug) ?? null;
}
