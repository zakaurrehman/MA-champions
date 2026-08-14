/**
 * Quote submission for the Belt Builder.
 *
 * v1 has no backend. A quote goes out through the customer's own mail client
 * or WhatsApp, both of which work with zero infrastructure and zero cost.
 *
 * KNOWN LIMITATION: a `mailto:` link cannot carry an attachment, so uploaded
 * artwork does NOT travel with the email. The UI says this plainly and asks
 * the customer to attach the file themselves.
 *
 * TODO (Phase 5/6): add `app/api/quote/route.ts` that accepts the spec plus
 * the file and sends it server-side (Resend/SendGrid/Nodemailer). Then
 * `submitQuote()` posts there and the limitation disappears. Keep the
 * signature below so the builder does not change.
 */

import type { BuildState } from './builder';
import { describeBuild } from './builder';
// From lib/format, not lib/products: quote.ts is reached from the Belt Builder,
// which is a client component. Importing the data boundary here would drag
// server-only into the browser bundle.
import { formatPrice } from './format';
import { site, whatsAppHref, mailtoHref } from './site';

export interface QuotePayload {
  build: BuildState;
  price: number;
  contactName: string;
  contactEmail: string;
  notes: string;
}

/** Plain-text spec used by every channel, so all of them say the same thing. */
export function buildQuoteText(payload: QuotePayload): string {
  const { build, price, contactName, contactEmail, notes } = payload;

  const lines: string[] = ['CHAMPIONSHIP BELT — QUOTE REQUEST', ''];

  for (const [label, value] of describeBuild(build)) {
    lines.push(`${label}: ${value}`);
  }

  lines.push('', `Indicative price: ${formatPrice(price)}`);

  if (contactName) lines.push('', `Name: ${contactName}`);
  if (contactEmail) lines.push(`Email: ${contactEmail}`);
  if (notes.trim()) lines.push('', `Notes: ${notes.trim()}`);

  if (build.artwork) {
    lines.push(
      '',
      `Artwork: ${build.artwork.name} — please attach this file to your reply.`
    );
  }

  return lines.join('\n');
}

export interface QuoteChannels {
  whatsapp: string | null;
  email: string | null;
  /** True when we hold no contact route at all and must fall back to /contact. */
  needsContactPage: boolean;
}

export function quoteChannels(payload: QuotePayload): QuoteChannels {
  const text = buildQuoteText(payload);
  const whatsapp = whatsAppHref(text);
  const email = mailtoHref('Championship belt quote request');

  return {
    whatsapp,
    // mailto bodies are capped by some clients; the spec is short enough.
    email: email ? `${email}&body=${encodeURIComponent(text)}` : null,
    needsContactPage: !whatsapp && !email,
  };
}

/** True when artwork was supplied but no channel can carry it automatically. */
export function artworkNeedsManualAttach(build: BuildState): boolean {
  return Boolean(build.artwork);
}

export const supportEmail = () => site.email;
