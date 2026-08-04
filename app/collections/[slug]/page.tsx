import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/ui/PageShell';
import EmptyState from '@/components/ui/EmptyState';
import ProductCard from '@/components/product/ProductCard';
import { getTierBySlug, LEAGUE_COLLECTIONS } from '@/lib/tiers';
import { getProductsByCollection, getProductsByTier } from '@/lib/products';

/**
 * Collection page — Phase 1 renders heading + grid + honest empty state.
 * Phase 2 adds the filter sidebar, sort and pagination.
 */

interface Params {
  params: Promise<{ slug: string }>;
}

async function resolve(slug: string) {
  const tier = await getTierBySlug(slug);
  if (tier) {
    return {
      name: tier.name,
      title: `${tier.name} Championship Belts`,
      intro: tier.blurb,
      products: await getProductsByTier(tier.id),
    };
  }

  const league = LEAGUE_COLLECTIONS.find((l) => l.slug === slug);
  if (league) {
    return {
      name: league.name,
      title: `${league.name} Championship Belts`,
      intro: league.blurb,
      products: await getProductsByCollection(league.id),
    };
  }

  return null;
}

export async function generateStaticParams() {
  const { getMaterialTiers } = await import('@/lib/tiers');
  const tiers = await getMaterialTiers();
  return [
    ...tiers.map((t) => ({ slug: t.slug })),
    ...LEAGUE_COLLECTIONS.map((l) => ({ slug: l.slug })),
  ];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await resolve(slug);
  if (!data) return { title: 'Collection not found' };

  return {
    title: data.title,
    description: `${data.intro} Custom and replica championship belts built in-house by M.A Champions Belts.`,
    alternates: { canonical: `/collections/${slug}` },
  };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const data = await resolve(slug);
  if (!data) notFound();

  return (
    <PageShell eyebrow="Collection" title={data.title} intro={data.intro}>
      {data.products.length === 0 ? (
        <EmptyState
          title="Nothing listed here yet"
          body="We are photographing this range now. Every belt in it can still be built to order — spec yours and we will quote it."
        />
      ) : (
        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {data.products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
