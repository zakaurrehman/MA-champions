import Link from 'next/link';
import { MAIN_NAV, POLICY_LINKS } from '@/lib/nav';
import { site, hasEmail, hasWhatsApp, whatsAppDisplay } from '@/lib/site';
import SocialLinks from './SocialLinks';
import { WhatsAppIcon } from '@/components/ui/Icons';
import Logo from './Logo';

/**
 * Footer. Contact details render only when we hold the real value — no
 * placeholder phone numbers or addresses are ever printed.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  const hasAddress = Boolean(site.address.city && site.address.country);

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          {/* Brand + contact */}
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              {site.description}
            </p>

            <div className="mt-6 flex flex-col gap-2 text-sm">
              {hasEmail() && (
                <a
                  href={`mailto:${site.email}`}
                  className="text-ink transition-colors hover:text-link"
                >
                  {site.email}
                </a>
              )}
              {hasWhatsApp() && (
                <a
                  href={`https://wa.me/${site.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-ink transition-colors hover:text-link"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {whatsAppDisplay()}
                </a>
              )}
              {hasAddress && (
                <address className="not-italic text-muted">
                  {[site.address.street, site.address.city, site.address.region, site.address.country]
                    .filter(Boolean)
                    .join(', ')}
                </address>
              )}
              {!hasEmail() && !hasWhatsApp() && (
                <Link href="/contact" className="text-ink transition-colors hover:text-link">
                  Contact us →
                </Link>
              )}
            </div>

            <div className="mt-8">
              <SocialLinks />
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {MAIN_NAV.map((group) => (
              <div key={group.label}>
                <h4 className="mb-4 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
                  {group.label}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {group.links.slice(0, 6).map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted transition-colors hover:text-link"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-5 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-2xs text-muted">
            © {year} {site.legalName}. All rights reserved.
          </p>

          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-2xs text-muted transition-colors hover:text-link"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/*
          TODO: payment icons render once the client confirms accepted payment
          methods. No payment integration exists in v1, so claiming card
          acceptance would be false. Social links are live above.
        */}
      </div>
    </footer>
  );
}
