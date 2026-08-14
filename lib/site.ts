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

  fulfilment: {
    processingTime: string;
    shippingTime: string;
  };

  /**
   * Crypto wallets shown at checkout.
   *
   * NEVER invent or guess an address. A crypto transfer is irreversible: one
   * wrong character and a customer's money is gone permanently, with no
   * chargeback, no support line and no way back. Every value here must be
   * copied from the client's own wallet and checked character by character.
   *
   * An empty array hides crypto checkout entirely.
   */
  policies: {
    /**
     * Days from delivery in which a return can be requested.
     *
     * This is the one number in the policies that creates a binding legal
     * commitment, so it is never guessed. While null, the refund page says the
     * window is confirmed in writing with the order rather than stating a
     * figure we might not honour.
     */
    refundWindowDays: number | null;
    /** Registered company name and number, if the client has one. */
    businessRegistration: string | null;
    /**
     * Flip to true only once the client has actually read the policies. Until
     * then every policy page carries a visible "in draft" notice — being seen
     * as unfinished is far cheaper than being bound by terms nobody read.
     */
    approved: boolean;
    lastUpdated: string | null;
  };

  cryptoWallets: {
    /** Display name, e.g. "USDT (TRC-20)". */
    label: string;
    /** Network, shown prominently — sending on the wrong chain loses funds. */
    network: string;
    address: string;
  }[];

  warranty: {
    available: boolean;
    duration: string | null;
    replacement: boolean;
    exchange: boolean;
    description: string;
  };

  /**
   * Marketing claims that are only true if you say they are. Each is null
   * until confirmed, and every surface that would state one checks first.
   * Never flip one of these to true without the client confirming it.
   */
  claims: {
    /** Do you send a design proof for approval before production? */
    freeDigitalProof: boolean | null;
    /** Typical first-response time to an enquiry, e.g. "one working day". */
    responseTime: string | null;
    /** Is shipping tracked to all destinations? */
    trackedShipping: boolean | null;
    /** How the belt is packed, e.g. "a fitted box". */
    packaging: string | null;
  };
}

export const site: SiteConfig = {
  name: 'M.A Champions Belts',
  legalName: 'M.A Champions Belts',
  tagline: 'Championship belts, built by hand',
  description:
    'Custom championship belts and replica title belts, made in-house from real cowhide and deep-etched metal with 24k gold plating. Design your own belt or shop our collections.',
  // The live domain. Feeds canonical URLs, the sitemap and structured data —
  // it must match the domain actually served or every canonical points at a
  // site that does not exist. Override per-environment with SITE_URL.
  url: process.env.SITE_URL ?? 'https://www.mawrestlingbelts.com',

  // Supplied by the client. wa.me requires digits only — no +, spaces or
  // dashes — so this is stored in link form. Displayed as +92 302 4057417.
  whatsapp: '923024057417',
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

  /*
   * Supplied by the client. Tracking parameters (mibextid, igsh, utm_source,
   * _r, _t) have been stripped — they are per-share analytics tokens, not part
   * of the address, and publishing them leaks how the link was obtained.
   *
   * NOTE: `facebook` points at the M.A Championship Belts GROUP. The client
   * also sent a personal Facebook profile ("Muhammad Ali"); that is
   * deliberately NOT published here — see TODO-BEFORE-LAUNCH.md.
   */
  social: {
    instagram: 'https://www.instagram.com/m.a_championship_belt',
    facebook: 'https://www.facebook.com/share/g/1BymFimgkH/',
    tiktok: 'https://www.tiktok.com/@m.achampionshipbelts',
    youtube: null, // TODO
  },

  shipping: {
    // Safe to state: supplied by the client in the project brief.
    freeTo: ['USA', 'Canada', 'UK'],
    worldwide: true,
  },

  /**
   * Global fulfilment terms shown on every product page. A product can override
   * either value via its own `fulfilment` block; almost none should need to.
   * Change these once here and every product updates.
   */
  fulfilment: {
    processingTime: '7–8 days',
    shippingTime: '4–5 business days after dispatch',
  },

  /*
   * TODO: client to supply. Copy each address directly from your wallet — do
   * not retype it. Crypto transfers cannot be reversed, so a single wrong
   * character permanently loses a customer's payment.
   *
   * Example of the shape once filled in:
   *   { label: 'USDT (TRC-20)', network: 'Tron (TRC-20)', address: 'T...' }
   */
  policies: {
    refundWindowDays: null, // TODO: 30 is the industry norm — confirm yours
    businessRegistration: null, // TODO
    approved: false, // TODO: set true once you have read the policy pages
    lastUpdated: null, // TODO: set the date you approved them
  },

  /*
   * Supplied by the client 2026-08-15. The base58check checksum was decoded and
   * verified before use — 25 bytes, prefix 0x41 (TRON mainnet), checksum match
   * — so this is not a mistyped address. That check matters because a crypto
   * transfer cannot be reversed.
   *
   * Re-verify the checksum before ever changing this, and copy from the wallet
   * rather than retyping.
   */
  cryptoWallets: [
    {
      label: 'USDT (TRC-20)',
      network: 'Tron (TRC-20)',
      address: 'TXAxgXnGDrhEucujwBeEh1DkLiYJ9awrYC',
    },
  ],

  /**
   * Default warranty terms. A product can override with its own `warranty`.
   * `replacement` and `exchange` drive what the product page tells the customer
   * is available, so only set them true where you will honour them.
   */
  warranty: {
    available: true,
    duration: null, // TODO: confirm the period, e.g. "30 days from delivery"
    replacement: true,
    exchange: true,
    description:
      'We stand behind how these belts are made. If a belt reaches you with a manufacturing fault — a plate defect, a plating flaw or a fault in the strap — contact us with photographs and we will arrange a replacement or exchange under the terms of our warranty.',
  },

  claims: {
    freeDigitalProof: null, // TODO: confirm
    responseTime: null, // TODO: confirm
    trackedShipping: null, // TODO: confirm
    packaging: null, // TODO: confirm
  },
};

/* -- Derived helpers. All null-safe; none invent a value. ----------------- */

export const hasWhatsApp = (): boolean => Boolean(site.whatsapp);
export const hasEmail = (): boolean => Boolean(site.email);

/**
 * The number formatted for reading, derived from the link form so the two can
 * never disagree. Falls back to the raw digits for any country code we have
 * not added a grouping rule for.
 */
export function whatsAppDisplay(): string | null {
  const raw = site.whatsapp;
  if (!raw) return null;
  // +92 3XX XXXXXXX (Pakistan)
  const pk = /^92(\d{3})(\d{7})$/.exec(raw);
  if (pk) return `+92 ${pk[1]} ${pk[2]}`;
  return `+${raw}`;
}

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

export interface SocialLink {
  label: string;
  href: string;
  /** Key used to pick the icon. */
  id: 'instagram' | 'facebook' | 'tiktok' | 'youtube';
}

/** Only the platforms we actually have, in display order. */
export function socialLinks(): SocialLink[] {
  const all: SocialLink[] = [
    { id: 'instagram', label: 'Instagram', href: site.social.instagram ?? '' },
    { id: 'facebook', label: 'Facebook', href: site.social.facebook ?? '' },
    { id: 'tiktok', label: 'TikTok', href: site.social.tiktok ?? '' },
    { id: 'youtube', label: 'YouTube', href: site.social.youtube ?? '' },
  ];
  return all.filter((s) => s.href.length > 0);
}

/** Profile URLs for Organization JSON-LD `sameAs`. */
export function sameAs(): string[] {
  return socialLinks().map((s) => s.href);
}

/**
 * Fulfilment terms for a product: its own overrides if present, otherwise the
 * global defaults. Every product therefore always has an answer.
 */
export function fulfilmentFor(product?: {
  fulfilment?: { processingTime?: string | null; shippingTime?: string | null };
}): { processingTime: string; shippingTime: string } {
  return {
    processingTime: product?.fulfilment?.processingTime ?? site.fulfilment.processingTime,
    shippingTime: product?.fulfilment?.shippingTime ?? site.fulfilment.shippingTime,
  };
}

/** Warranty terms for a product, falling back to the site default. */
export function warrantyFor(product?: {
  warranty?: {
    available: boolean;
    duration: string | null;
    replacement: boolean;
    exchange: boolean;
    description: string | null;
  } | null;
}): {
  available: boolean;
  duration: string | null;
  replacement: boolean;
  exchange: boolean;
  description: string;
} {
  const w = product?.warranty;
  if (!w) return site.warranty;

  return {
    available: w.available,
    duration: w.duration ?? site.warranty.duration,
    replacement: w.replacement,
    exchange: w.exchange,
    description: w.description ?? site.warranty.description,
  };
}

/** Human lead-time string, or null if we cannot state one honestly. */
export function leadTimeLabel(kind: 'stock' | 'custom'): string | null {
  const days =
    kind === 'stock' ? site.leadTimes.stockBuildDays : site.leadTimes.customBuildDays;
  return days ? `${days} to build` : null;
}
