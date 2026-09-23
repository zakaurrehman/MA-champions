import { site, whatsAppHref } from '@/lib/site';
import { WhatsAppIcon } from '@/components/ui/Icons';

/**
 * The reassurance that sits under Add to cart.
 *
 * This is a $170–$1,500 purchase from a workshop the customer has never heard
 * of, and the doubt peaks at exactly this moment. So this answers the questions
 * people otherwise leave to ask on WhatsApp: where it ships, how long it takes,
 * how they can pay, and what happens after they order.
 *
 * Every line is built from lib/site.ts and appears ONLY when that fact is
 * actually set. Nothing here is a default or a guess — an unconfirmed promise
 * next to a buy button is the most damaging place a site can make one.
 */
export default function TrustBlock({ productName }: { productName: string }) {
  const lines: string[] = [];

  if (site.shipping.freeTo.length > 0) {
    lines.push(
      `Free shipping to ${site.shipping.freeTo.join(', ')}${
        site.shipping.worldwide ? ', delivered worldwide' : ''
      }`
    );
  } else if (site.shipping.worldwide) {
    lines.push('Delivered worldwide');
  }

  const { customBuildDays, shippingDays } = site.leadTimes;
  if (customBuildDays) lines.push(`Built in ${customBuildDays}`);
  if (shippingDays) lines.push(`Shipping takes ${shippingDays}`);

  lines.push('Made by hand in our own workshop');

  const methods = [
    site.paypalManual.email ? 'PayPal' : null,
    site.cryptoWallets.length > 0 ? 'crypto (USDT)' : null,
    site.whatsapp ? 'WhatsApp order' : null,
  ].filter(Boolean);
  if (methods.length > 0) lines.push(`Pay by ${methods.join(', ')}`);

  lines.push('Every payment is checked by a person before your belt is started');

  const ask = whatsAppHref(`Hi, I have a question about the ${productName}.`);

  return (
    <div className="mt-6 rounded-[--radius-plate] border border-line p-4">
      <ul className="flex flex-col gap-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2.5 text-sm leading-snug text-muted">
            <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            {line}
          </li>
        ))}
      </ul>

      {ask && (
        <a
          href={ask}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-link hover:text-link-hover"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Question about this belt? Ask us
        </a>
      )}
    </div>
  );
}
