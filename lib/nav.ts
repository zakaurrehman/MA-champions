/**
 * Navigation model. Shared by the desktop mega-menu, the mobile drawer and the
 * footer so the three can never drift apart.
 */

import { LEAGUE_COLLECTIONS } from './tiers';

export interface NavLink {
  label: string;
  href: string;
  /** Shown in the mega-menu only. */
  hint?: string;
}

export interface NavGroup {
  label: string;
  href?: string;
  links: NavLink[];
}

/** Mirrors data/tiers.json. Kept as links so nav never needs an async read. */
export const TIER_LINKS: NavLink[] = [
  {
    label: 'All Belts',
    href: '/collections/all-championship-belts',
    hint: 'Everything we build',
  },
  { label: 'Brass', href: '/collections/brass-championship-belts', hint: 'Entry tier' },
  { label: 'Boxing', href: '/collections/boxing-championship-belts', hint: 'Round plate' },
  { label: 'Zinc', href: '/collections/zinc-championship-belts', hint: 'Deep etched' },
  { label: '24K Gold', href: '/collections/24k-gold-championship-belts', hint: 'True plating' },
  { label: 'HD & CNC', href: '/collections/hd-cnc-championship-belts', hint: 'Machine cut' },
  { label: 'Fully Custom', href: '/collections/custom-championship-belts', hint: 'From scratch' },
];

export const LEAGUE_LINKS: NavLink[] = LEAGUE_COLLECTIONS.map((c) => ({
  label: c.name,
  href: `/collections/${c.slug}`,
  hint: c.blurb,
}));

export const MAIN_NAV: NavGroup[] = [
  {
    label: 'Shop by Material',
    href: '/pricing',
    links: TIER_LINKS,
  },
  {
    label: 'Shop by Sport',
    href: '/collections',
    links: LEAGUE_LINKS,
  },
  {
    label: 'Custom',
    href: '/custom',
    links: [
      { label: 'Belt Builder', href: '/build', hint: 'Design yours step by step' },
      { label: 'Custom Work', href: '/custom', hint: 'Belts we have built' },
      { label: 'Pricing', href: '/pricing', hint: 'Compare all six tiers' },
    ],
  },
  {
    label: 'Info',
    href: '/about',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'FAQs', href: '/faqs' },
      { label: 'Reviews', href: '/reviews' },
      { label: 'Blog', href: '/blog' },
      { label: 'Track Order', href: '/track-order' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

export const POLICY_LINKS: NavLink[] = [
  { label: 'Privacy Policy', href: '/policies/privacy' },
  { label: 'Refund Policy', href: '/policies/refund' },
  { label: 'Shipping Policy', href: '/policies/shipping' },
  { label: 'Terms of Service', href: '/policies/terms' },
];
