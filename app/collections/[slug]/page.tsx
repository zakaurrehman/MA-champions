import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageShell from '@/components/ui/PageShell';
import CollectionView from '@/components/collection/CollectionView';
import { getTierBySlug, LEAGUE_COLLECTIONS, ALL_BELTS_SLUG } from '@/lib/tiers';
import { getProductsByCollection, getProductsByTier, getShopProducts } from '@/lib/products';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

/**
 * Collection page. Stays statically rendered; CollectionView reads filter
 * state from the URL on the client, which is why it needs a Suspense boundary.
 */

interface Params {
  params: Promise<{ slug: string }>;
}

async function resolve(slug: string) {
  if (slug === ALL_BELTS_SLUG) {
    return {
      name: 'All Belts',
      title: 'All Championship Belts',
      intro:
        'Every belt we currently build, in one place. Filter by material, price or sport.',
      products: await getShopProducts(),
    };
  }

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
    { slug: ALL_BELTS_SLUG },
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
      <CollectionView products={data.products} />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Collections', path: '/collections' },
          { name: data.name, path: `/collections/${slug}` },
        ])}
      />
    </PageShell>
  );
}
