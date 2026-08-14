import { site, whatsAppDisplay } from './site';

/**
 * Policy content.
 *
 * DRAFTS. Written from what this codebase actually does — the privacy policy
 * in particular describes the real data flows, not a generic template — but
 * they are not legal advice and must be read and approved before launch.
 *
 * Everything is generated from lib/site.ts rather than hardcoded, so the
 * policies cannot drift from the site's real behaviour. Fill in a lead time or
 * an address and these pages update with it.
 */

export interface PolicySection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Policy {
  title: string;
  intro: string;
  sections: PolicySection[];
}

const contact = (): string => {
  const parts: string[] = [];
  if (site.email) parts.push(site.email);
  const wa = whatsAppDisplay();
  if (wa) parts.push(`WhatsApp ${wa}`);
  return parts.length > 0 ? parts.join(' or ') : 'our contact page';
};

const regions = site.shipping.freeTo.join(', ');

/* ------------------------------------------------------------------ */

function shipping(): Policy {
  const build = site.leadTimes.stockBuildDays ?? site.fulfilment.processingTime;
  const custom = site.leadTimes.customBuildDays;

  return {
    title: 'Shipping Policy',
    intro: `How long your belt takes to make, how it gets to you, and what it costs.`,
    sections: [
      {
        heading: 'Processing time',
        paragraphs: [
          `Every belt is made to order. Your belt is built in ${build} from the point your order is confirmed, before it is dispatched.`,
          custom
            ? `Fully custom belts, where we draw new plate artwork, take ${custom}.`
            : 'Fully custom belts, where we draw new plate artwork from scratch, take longer. We confirm your build time in writing before you pay, and we do not quote a date we cannot hold.',
        ],
      },
      {
        heading: 'Delivery',
        paragraphs: [
          `Once dispatched, your belt arrives ${site.fulfilment.shippingTime}.`,
          site.shipping.worldwide
            ? 'We ship worldwide. Delivery outside the free-shipping regions is quoted with your order, so there is nothing to pay on arrival that you were not told about.'
            : `We currently ship to ${regions}.`,
        ],
      },
      {
        heading: 'Shipping cost',
        paragraphs: [
          `Shipping is free to ${regions}.`,
          'Everywhere else is quoted before you pay.',
        ],
      },
      {
        heading: 'Customs and import duties',
        paragraphs: [
          'Orders shipped outside our own country may attract import duty, VAT or customs handling fees on arrival. These are set by your government, not by us, and are the responsibility of the person receiving the belt.',
          'We cannot predict these charges or mark parcels as gifts to reduce them.',
        ],
      },
      {
        heading: 'Tracking',
        paragraphs: [
          'You receive an order reference when you order. Enter it on our track order page at any time to see the current stage, and the courier tracking number once your belt has shipped.',
        ],
      },
      {
        heading: 'Incorrect addresses',
        paragraphs: [
          `Please check your delivery address carefully. If a parcel is returned to us because the address was wrong or nobody was available, we will contact you to arrange redelivery, which may be chargeable. Tell us as soon as possible if you need to change an address — reach us at ${contact()}.`,
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ */

function refund(): Policy {
  const window = site.policies.refundWindowDays;

  return {
    title: 'Refund & Returns Policy',
    intro:
      'What happens if something is wrong with your belt, and what applies to made-to-order work.',
    sections: [
      {
        heading: 'Faulty or damaged belts',
        paragraphs: [
          window
            ? `If your belt arrives damaged, faulty, or not as described, contact us within ${window} days of delivery and we will put it right — by repair, replacement or refund.`
            : `If your belt arrives damaged, faulty, or not as described, contact us as soon as you can and we will put it right — by repair, replacement or refund. Your exact return window is confirmed in writing with your order.`,
          'Please send photographs of the problem with your first message. It is almost always faster to resolve that way, and it means we can start a replacement immediately if one is needed.',
        ],
      },
      {
        heading: 'Made-to-order and personalised belts',
        paragraphs: [
          'Every belt we make is built for your order. Belts that are engraved, made from your own artwork, or built to a specification you chose cannot be resold, so they are not returnable simply because you changed your mind.',
          'This does not affect your rights if the belt is faulty, damaged, or materially different from what you ordered.',
        ],
      },
      {
        heading: 'Before we cut metal',
        paragraphs: [
          'Custom orders are confirmed with you before production begins. If you want to change or cancel your order, tell us straight away — if we have not yet started, we can usually cancel with a full refund.',
        ],
      },
      {
        heading: 'How to start a return',
        paragraphs: [
          `Message us at ${contact()} with your order reference and photographs. We will tell you whether to return the belt and where to send it before you post anything.`,
          'Please do not send a belt back without contacting us first — we may not be able to trace it.',
        ],
      },
      {
        heading: 'Refunds',
        paragraphs: [
          'Approved refunds are returned to the original payment method. Card and PayPal refunds usually take a few working days to appear, depending on your provider.',
          'Cryptocurrency payments are refunded in the same currency, to a wallet address you confirm with us. The amount refunded is the amount we received; we cannot compensate for changes in exchange rate between payment and refund.',
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ */

function privacy(): Policy {
  return {
    title: 'Privacy Policy',
    intro: 'What we collect, why, and how long we keep it.',
    sections: [
      {
        heading: 'What we collect',
        paragraphs: ['We collect only what we need to build and deliver your belt.'],
        bullets: [
          'Order details — the belts you chose, your build options, any engraving text, and any notes you add.',
          'Contact details — your name and email address when you place an order or submit a custom build request.',
          'Reviews — the name you choose to display, your rating and your review text.',
          'Payment references — if you pay by cryptocurrency, the transaction reference and any screenshot you send us so we can confirm the payment.',
          'A technical identifier — a one-way hash of your IP address and browser, used only to stop spam and repeated submissions. We do not store your IP address itself and the hash cannot be reversed.',
        ],
      },
      {
        heading: 'What we do not collect',
        paragraphs: [
          'We do not store card numbers. Card payments are handled entirely by PayPal, who never share your card details with us.',
          'We do not sell or rent your information to anyone, and we do not use it to build advertising profiles.',
        ],
      },
      {
        heading: 'Information stored in your browser',
        paragraphs: [
          'Your cart, wishlist, recently viewed belts, saved Belt Builder progress and your light or dark theme preference are stored in your own browser, not on our servers. Clearing your browser data removes them.',
          'These are not tracking cookies and are not shared with third parties.',
        ],
      },
      {
        heading: 'Who we share it with',
        paragraphs: ['We share the minimum necessary with the services that run this shop:'],
        bullets: [
          'Our hosting and database providers, which store your order so we can fulfil it.',
          'PayPal, if you pay by card, to process that payment.',
          'The courier, which needs your delivery address to bring you your belt.',
        ],
      },
      {
        heading: 'How long we keep it',
        paragraphs: [
          'We keep order records for as long as we need them for warranty, accounting and tax purposes.',
          'Published reviews stay until you ask us to remove them.',
          'Spam-prevention hashes are short-lived and are not linked to your order.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: [
          `You can ask us for a copy of what we hold about you, ask us to correct it, or ask us to delete it. Message us at ${contact()} and we will action it.`,
          'We may need to keep some order records even after a deletion request, where the law requires it for tax or accounting.',
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ */

function terms(): Policy {
  return {
    title: 'Terms of Service',
    intro: 'The terms you agree to when you order a belt from us.',
    sections: [
      {
        heading: 'Orders and quotes',
        paragraphs: [
          'Prices shown on this website are indicative. A custom or made-to-order belt is confirmed by a written quote from us, and your order is formed when you accept that quote and pay.',
          'We may decline or cancel an order — for example if a belt is mispriced, unavailable, or if we cannot lawfully make what has been asked for. If we cancel after you have paid, you get a full refund.',
        ],
      },
      {
        heading: 'Artwork you send us',
        paragraphs: [
          'When you send artwork, a logo or a design for us to reproduce, you confirm that you own it or have permission to use it, and that making a belt from it does not infringe anyone else\'s rights.',
          'We may decline any artwork at our discretion. You remain responsible for the rights in the artwork you supply.',
        ],
      },
      {
        heading: 'Handmade variation',
        paragraphs: [
          'Every belt is made and finished by hand. Small variations in plating tone, texture and leather grain are normal and are not faults. Photographs on this site show real belts, but screens vary, so colours may not match exactly.',
        ],
      },
      {
        heading: 'Lead times',
        paragraphs: [
          'Build and delivery times are estimates given in good faith. We will tell you as soon as we can if anything is going to be late, and we do not quote a date we do not expect to hold.',
        ],
      },
      {
        heading: 'Our liability',
        paragraphs: [
          'We are responsible for supplying a belt that matches what you ordered and is free from defects. If we get that wrong, we will repair, replace or refund it.',
          'We are not liable for indirect losses — for example a missed event — beyond the value of your order. Nothing in these terms limits liability that cannot lawfully be limited.',
        ],
      },
      {
        heading: 'Contacting us',
        paragraphs: [
          `Questions about these terms can go to ${contact()}.`,
          site.policies.businessRegistration
            ? `${site.legalName} — ${site.policies.businessRegistration}.`
            : `These terms are offered by ${site.legalName}.`,
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ */

export const POLICY_SLUGS = ['shipping', 'refund', 'privacy', 'terms'] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

export function getPolicy(slug: PolicySlug): Policy {
  switch (slug) {
    case 'shipping':
      return shipping();
    case 'refund':
      return refund();
    case 'privacy':
      return privacy();
    case 'terms':
      return terms();
  }
}
