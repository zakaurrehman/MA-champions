/**
 * BUSINESS FACTS — SINGLE SOURCE OF TRUTH
 * ───────────────────────────────────────
 * Every value below that is `null` is a real fact we do not have yet. None of
 * them are guessed, and nothing renders a fake value: components check for null
 * and degrade to a safe fallback (see `hasWhatsApp`, `contactHref`, etc.).
 *
 * Fill these in and the whole site updates. Checklist: TODO-BEFORE-LAUNCH.md
 */

export interface LeadTimes {
  /** Working days to build an in-stock/replica belt, before shipping. */
  stockBuildDays: string | null;
  /** Working days to build a fully custom belt, before shipping. */
  customBuildDays: string | null;
  /** Transit time, quoted separately from build time. */
  shippingDays: string | null;
}

export interface SiteConfig {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  url: string;

  // TODO: client has these — awaiting values.
  whatsapp: string | null;
  email: string | null;
  phone: string | null;
  address: {
    street: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
  };
  foundedYear: number | null;

  leadTimes: LeadTimes;

  social: {
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    youtube: string | null;
  };

  shipping: {
    freeTo: string[];
    worldwide: boolean;
  };
}

export const site: SiteConfig = {
  name: 'M.A Champions Belts',
  legalName: 'M.A Champions Belts',
  tagline: 'Championship belts, built by hand',
  description:
    'Custom championship belts and replica title belts, made in-house from real cowhide and deep-etched metal with 24k gold plating. Design your own belt or shop our collections.',
  url: 'https://machampionsbelts.com', // TODO: confirm production domain

  whatsapp: null, // TODO: client to supply — with country code, digits only
  email: null, // TODO: client to supply
  phone: null, // TODO: client to supply (optional if WhatsApp covers it)

  address: {
    street: null, // TODO
    city: null, // TODO
    region: null, // TODO
    postalCode: null, // TODO
    country: null, // TODO
  },

  foundedYear: null, // TODO: drives "X years in business" on /about

  leadTimes: {
    stockBuildDays: null, // TODO
    customBuildDays: null, // TODO
    shippingDays: null, // TODO
  },

  social: {
    instagram: null, // TODO
    facebook: null, // TODO
    tiktok: null, // TODO
    youtube: null, // TODO
  },

  shipping: {
    // Safe to state: matches the brief's announcement-bar copy.
    freeTo: ['USA', 'Canada', 'UK'],
    worldwide: true,
  },
};

/* -- Derived helpers. All null-safe; none invent a value. ----------------- */

export const hasWhatsApp = (): boolean => Boolean(site.whatsapp);
export const hasEmail = (): boolean => Boolean(site.email);

/**
 * WhatsApp deep link with a prefilled message, or null when we have no number.
 * Callers must handle null by falling back to the contact page.
 */
export function whatsAppHref(message: string): string | null {
  if (!site.whatsapp) return null;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function mailtoHref(subject: string): string | null {
  if (!site.email) return null;
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
}

/** Where a "talk to us" CTA should point given what we currently know. */
export function contactHref(message: string): string {
  return whatsAppHref(message) ?? mailtoHref(message) ?? '/contact';
}

export function yearsInBusiness(): number | null {
  if (!site.foundedYear) return null;
  return new Date().getFullYear() - site.foundedYear;
}

/** Human lead-time string, or null if we cannot state one honestly. */
export function leadTimeLabel(kind: 'stock' | 'custom'): string | null {
  const days =
    kind === 'stock' ? site.leadTimes.stockBuildDays : site.leadTimes.customBuildDays;
  return days ? `${days} to build` : null;
}
