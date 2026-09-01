import type { Metadata } from 'next';

/**
 * Per-page titles, descriptions and keywords, from the SEO sheet.
 *
 * One map rather than 24 hand-edited pages: the sheet is maintained as a
 * table, so keeping the code in the same shape means the next revision is a
 * diff here instead of a hunt through the app directory.
 *
 * Three editorial rules were applied to the supplied copy:
 *
 * 1. NO THIRD-PARTY TRADEMARKS. The sheet put "WWE, AEW, UFC, WCW" in a title
 *    and description. Naming another company's marks in a title tag is a
 *    public claim, in Google's results, that you sell their goods — which is
 *    the fact pattern that draws takedowns and delisting, and WWE in
 *    particular enforces against replica sellers. The search intent is kept
 *    with "replica", "professional wrestling" and the sports names, which are
 *    descriptive and are ours to use.
 *
 * 2. DESCRIPTIONS TRIMMED TO ~155 CHARACTERS. Google truncates around there.
 *    Most of the supplied copy ran 170-190, so the closing clause — usually
 *    "with worldwide shipping" — was being cut off mid-sentence in results.
 *
 * 3. TITLES ARE ABSOLUTE. The root layout appends "| M.A Champions Belts" to
 *    every title. The sheet's titles already end in "| MA Wrestling Belts", so
 *    without `absolute` every page would carry two brand suffixes.
 */

export interface PageSeo {
  /** Full title including the brand suffix. Applied with `absolute`. */
  title: string;
  description: string;
  /**
   * The keywords meta tag. Google has ignored it since 2009 and it is not a
   * ranking factor anywhere that matters — it is here because the sheet asks
   * for it, it costs nothing, and some internal tools and smaller engines
   * still read it. It is not doing the work; the title and description are.
   */
  keywords: string[];
}

export const PAGE_SEO: Record<string, PageSeo> = {
  '/': {
    title: 'MA Wrestling Belts | Premium Custom Championship Wrestling Belts',
    description:
      'Premium custom championship wrestling belts, handmade from real leather and deep-etched metal. Replica, custom and collector belts, shipped worldwide.',
    keywords: [
      'championship belts custom',
      'heavy weight belt',
      'wrestling golden champion belt',
      'custom wrestling belts',
      'replica championship belts',
    ],
  },

  '/collections/all-championship-belts': {
    title: 'All Championship Belts for Sale | Replica & Custom | MA Wrestling Belts',
    description:
      'Shop every championship belt we make: wrestling, boxing, MMA, fantasy and fully custom title belts. Handcrafted replicas, shipped worldwide.',
    keywords: [
      'all championship belts',
      'wrestling championship belts',
      'replica championship belts',
      'custom championship belts',
    ],
  },

  '/collections/brass-championship-belts': {
    title: 'Brass Championship Belts for Sale | Premium Wrestling Belts | MA Wrestling Belts',
    description:
      'Premium brass championship belts with solid brass plates and genuine leather straps. Custom and replica wrestling title belts, shipped worldwide.',
    keywords: [
      'brass wrestling belts',
      'brass title belts',
      'wrestling championship belts',
      'premium brass belts',
    ],
  },

  /*
   * The sheet lists this URL twice, as rows 4 and 14, with different copy.
   * It is one page — the Boxing entry appears under both "Shop by Material"
   * and "Shop by Sport" — so the two sets are merged here.
   */
  '/collections/boxing-championship-belts': {
    title: 'Boxing Championship Belts for Sale | Custom & Replica Belts | MA Wrestling Belts',
    description:
      'Premium boxing championship belts for gyms, promotions and tournaments. Custom and replica designs with metal plates and leather straps, shipped worldwide.',
    keywords: [
      'boxing championship belt',
      'boxing belts',
      'boxing title belts',
      'custom boxing belts',
      'replica boxing belts',
      'professional boxing belts',
    ],
  },

  '/collections/zinc-championship-belts': {
    title: 'Zinc Championship Belts for Sale | Replica & Custom Belts | MA Wrestling Belts',
    description:
      'Browse premium zinc championship belts with durable zinc alloy plates and genuine leather straps. Shop custom and replica title belts with worldwide shipping.',
    keywords: [
      'zinc wrestling belts',
      'zinc championship belt',
      'zinc replica belts',
      'custom zinc championship belts',
      'wrestling title belts',
    ],
  },

  '/collections/24k-gold-championship-belts': {
    title: '24K Gold Championship Belts | Premium Wrestling Belts | MA Wrestling Belts',
    description:
      'Premium 24K gold championship belts with gold-plated metal plates and genuine leather straps. Custom and replica title belts, shipped worldwide.',
    keywords: [
      '24k gold wrestling belts',
      'gold championship belts',
      'gold plated championship belts',
      'custom gold championship belts',
    ],
  },

  '/collections/hd-cnc-championship-belts': {
    title: 'HD CNC Championship Belts | Premium CNC Wrestling Belts | MA Wrestling Belts',
    description:
      'HD CNC championship belts with precision machine-cut metal plates and sealed-edge leather. Premium custom and replica title belts, shipped worldwide.',
    keywords: [
      'cnc championship belts',
      'hd cnc wrestling belts',
      'cnc wrestling belts',
      'precision championship belts',
    ],
  },

  '/collections/custom-championship-belts': {
    title: 'Custom Championship Belts | Personalized Wrestling Belts | MA Wrestling Belts',
    description:
      'Design your own championship belt: choose plates, leather, colours and engraving. Handcrafted to order and shipped worldwide.',
    keywords: [
      'personalized championship belts',
      'custom wrestling belts',
      'custom title belts',
      'personalized wrestling belts',
      'championship belt maker',
    ],
  },

  '/collections/football-championship-belts': {
    title: 'Football Championship Belts for Sale | Custom & Replica Belts | MA Wrestling Belts',
    description:
      'Shop premium football championship belts for leagues, tournaments, fantasy football and awards. Custom and replica title belts, shipped worldwide.',
    keywords: [
      'football championship belt',
      'football title belts',
      'custom football belts',
      'fantasy football championship belt',
    ],
  },

  '/collections/basketball-championship-belts': {
    title: 'Basketball Championship Belts for Sale | Custom & Replica | MA Wrestling Belts',
    description:
      'Shop premium basketball championship belts for leagues, tournaments, MVP awards and champions. Custom and replica title belts, shipped worldwide.',
    keywords: [
      'basketball championship belt',
      'basketball title belts',
      'custom basketball belts',
      'basketball trophy belt',
    ],
  },

  '/collections/hockey-championship-belts': {
    title: 'Hockey Championship Belts for Sale | Custom & Replica Belts | MA Wrestling Belts',
    description:
      'Shop premium hockey championship belts for leagues, tournaments, MVP awards and champions. Custom and replica title belts, shipped worldwide.',
    keywords: [
      'hockey championship belt',
      'hockey title belts',
      'custom hockey belts',
      'hockey trophy belt',
    ],
  },

  '/collections/baseball-championship-belts': {
    title: 'Baseball Championship Belts for Sale | Custom & Replica Belts | MA Wrestling Belts',
    description:
      'Shop premium baseball championship belts for leagues, tournaments, MVP awards and champions. Custom and replica title belts, shipped worldwide.',
    keywords: [
      'baseball championship belt',
      'baseball title belts',
      'custom baseball belts',
      'baseball trophy belt',
    ],
  },

  '/collections/wrestling-championship-belts': {
    title: 'Wrestling Championship Belts for Sale | Custom & Replica | MA Wrestling Belts',
    description:
      'Premium wrestling championship belts: custom, replica and heavyweight title belts in real leather and deep-etched metal. Shipped worldwide.',
    keywords: [
      'wrestling belts',
      'championship wrestling belts',
      'replica wrestling belts',
      'custom wrestling belts',
    ],
  },

  '/collections/mma-championship-belts': {
    title: 'MMA Championship Belts for Sale | Custom & Replica Belts | MA Wrestling Belts',
    description:
      'Shop premium MMA championship belts for promotions, tournaments, gyms and champions. Custom and replica MMA title belts, shipped worldwide.',
    keywords: [
      'mma championship belt',
      'mma belts',
      'custom mma belts',
      'mixed martial arts belts',
      'cage fighting championship belts',
    ],
  },

  '/collections/fantasy-league-belts': {
    title: 'Fantasy League Belts | Custom Fantasy Championship Belts | MA Wrestling Belts',
    description:
      'Shop premium fantasy league belts for football, baseball, basketball and other fantasy sports. Customise your championship belt, shipped worldwide.',
    keywords: [
      'fantasy championship belts',
      'fantasy football belt',
      'fantasy sports belts',
      'custom fantasy league belts',
    ],
  },

  '/build': {
    title: 'Build Your Own Championship Belt | Custom Belt Builder | MA Wrestling Belts',
    description:
      'Design your own championship belt with our custom belt builder. Personalise plates, leather straps, colours, logos and text to create a one-of-a-kind title belt.',
    keywords: [
      'custom championship belt builder',
      'design your own championship belt',
      'create your own championship belt',
      'personalized championship belt',
    ],
  },

  '/about': {
    title: 'About MA Wrestling Belts | Premium Custom Championship Belts',
    description:
      'Learn about MA Wrestling Belts, a maker of premium custom and replica championship belts. Our craftsmanship, materials and worldwide shipping.',
    keywords: [
      'ma wrestling belts',
      'championship belt manufacturer',
      'custom championship belts',
      'replica championship belts',
      'wrestling belt manufacturer',
    ],
  },

  '/pricing': {
    title: 'Championship Belt Pricing | Custom Belt Prices | MA Wrestling Belts',
    description:
      'Championship belt pricing by material and build: brass, zinc, 24K gold and HD CNC. Clear prices, quality craftsmanship and worldwide shipping.',
    keywords: [
      'custom championship belt prices',
      'championship belt cost',
      'custom belt pricing',
      'replica championship belt prices',
    ],
  },

  '/faqs': {
    title: 'Championship Belt FAQs | Custom & Replica Belt Questions | MA Wrestling Belts',
    description:
      'Answers to common questions about custom and replica championship belts: orders, shipping, materials, sizing and production times.',
    keywords: [
      'custom championship belt faq',
      'wrestling belt faqs',
      'replica championship belt questions',
      'championship belt help',
    ],
  },

  '/reviews': {
    title: 'Customer Reviews | Championship Belts Reviews | MA Wrestling Belts',
    description:
      'Real customer reviews and photos of custom and replica championship belts from MA Wrestling Belts. See the belts our customers received.',
    keywords: [
      'customer reviews',
      'wrestling belt reviews',
      'custom championship belt reviews',
      'replica belt reviews',
    ],
  },

  '/contact': {
    title: 'Contact MA Wrestling Belts | Custom Championship Belt Experts',
    description:
      'Contact MA Wrestling Belts about custom championship belts, pricing, bulk orders and support. Message us on WhatsApp or send us your design.',
    keywords: [
      'contact championship belt manufacturer',
      'custom championship belt support',
      'wrestling belt customer service',
      'championship belt contact',
    ],
  },

  '/track-order': {
    title: 'Track Your Championship Belt Order | MA Wrestling Belts',
    description:
      'Track your championship belt order online with MA Wrestling Belts. Check your order status, shipping updates and delivery progress quickly and securely.',
    keywords: [
      'track order',
      'order tracking',
      'championship belt order status',
      'custom belt order tracking',
    ],
  },

  '/blog': {
    title: 'Championship Belt Blog | Wrestling Belt News & Guides | MA Wrestling Belts',
    description:
      'Explore the MA Wrestling Belts blog for expert guides, championship belt news, custom belt ideas, wrestling history, buying tips and product updates.',
    keywords: [
      'wrestling belt blog',
      'championship belt guides',
      'custom championship belt blog',
      'wrestling belt news',
    ],
  },
};

/**
 * Metadata for a path, or null when the sheet does not cover it.
 *
 * `title.absolute` bypasses the root layout's "%s | M.A Champions Belts"
 * template — these titles already carry their own brand suffix.
 */
export function seoFor(path: string): Metadata | null {
  const entry = PAGE_SEO[path];
  if (!entry) return null;

  return {
    title: { absolute: entry.title },
    description: entry.description,
    keywords: entry.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: entry.title,
      description: entry.description,
      url: path,
    },
  };
}
