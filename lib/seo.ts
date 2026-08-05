/**
 * Structured data builders.
 *
 * All JSON-LD is generated here rather than inline in pages, so a field is
 * defined once and cannot drift between the markup and the visible page —
 * which is exactly what gets rich results suppressed.
 *
 * Rule followed throughout: never emit a property we cannot substantiate.
 * An absent `aggregateRating` costs nothing; a fabricated one is a
 * manual-action risk and, for reviews, unlawful in several jurisdictions.
 */

import { site, sameAs } from './site';
import type { Product } from './types';

const abs = (path: string): string =>
  path.startsWith('http') ? path : `${site.url.replace(/\/$/, '')}${path}`;

export interface Crumb {
  name: string;
  path: string;
}

/** Organization — emitted once, site-wide. */
export function organizationJsonLd() {
  const profiles = sameAs();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.name,
    legalName: site.legalName,
    description: site.description,
    url: site.url,
    ...(profiles.length > 0 && { sameAs: profiles }),
    ...(site.email && { email: site.email }),
    ...(site.whatsapp && {
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: `+${site.whatsapp}`,
        availableLanguage: ['en'],
      },
    }),
    // Address is only emitted when we actually hold one — a partial
    // PostalAddress is worse than none.
    ...(site.address.city &&
      site.address.country && {
        address: {
          '@type': 'PostalAddress',
          ...(site.address.street && { streetAddress: site.address.street }),
          addressLocality: site.address.city,
          ...(site.address.region && { addressRegion: site.address.region }),
          ...(site.address.postalCode && { postalCode: site.address.postalCode }),
          addressCountry: site.address.country,
        },
      }),
    ...(site.foundedYear && { foundingDate: String(site.foundedYear) }),
  };
}

/** WebSite, with the search action that enables a sitelinks search box. */
export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.name,
    url: site.url,
    publisher: { '@id': `${site.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: abs(crumb.path),
    })),
  };
}

interface ProductJsonLdOptions {
  product: Product;
  /** Only supplied when real, verified reviews exist. */
  rating?: { value: number; count: number } | null;
}

export function productJsonLd({ product, rating }: ProductJsonLdOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    sku: product.id,
    image: product.images.map((image) => abs(image.src)),
    brand: { '@type': 'Brand', name: site.name },
    ...(product.specs.plateMaterial &&
      !product.specs.plateMaterial.startsWith('TODO') && {
        material: product.specs.plateMaterial,
      }),
    offers: {
      '@type': 'Offer',
      url: abs(`/products/${product.slug}`),
      price: product.salePrice ?? product.price,
      priceCurrency: product.currency,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@id': `${site.url}/#organization` },
    },
    // Omitted entirely when there are no reviews. Google issues manual
    // actions for aggregateRating that does not match visible content.
    ...(rating && rating.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.value,
            reviewCount: rating.count,
          },
        }
      : {}),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}
