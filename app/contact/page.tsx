import type { Metadata } from 'next';
import { seoFor } from '@/lib/seoMeta';
import PageShell from '@/components/ui/PageShell';
import ContactForm from '@/components/contact/ContactForm';
import { site, hasEmail, hasWhatsApp, whatsAppDisplay } from '@/lib/site';
import { WhatsAppIcon } from '@/components/ui/Icons';

export const metadata: Metadata = {
  ...seoFor("/contact")!,
};

export default function ContactPage() {
  const addressLines = [
    site.address.street,
    [site.address.city, site.address.region].filter(Boolean).join(', '),
    [site.address.postalCode, site.address.country].filter(Boolean).join(' '),
  ].filter(Boolean) as string[];

  const hasAddress = addressLines.length > 0;

  return (
    <PageShell
      eyebrow="Contact"
      title="Talk to us"
      intro="Questions about a build, a quote or an order already in progress — send them here and a person will read them."
    >
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <ContactForm
          subject="Website enquiry"
          messagePlaceholder="Tell us what you are after — style, materials, quantity, deadline…"
        />

        <aside className="flex flex-col gap-8">
          {(hasEmail() || hasWhatsApp()) && (
            <div>
              <h2 className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
                Direct
              </h2>
              <ul className="flex flex-col gap-2.5 text-sm">
                {hasEmail() && (
                  <li>
                    <a href={`mailto:${site.email}`} className="text-ink hover:text-link">
                      {site.email}
                    </a>
                  </li>
                )}
                {hasWhatsApp() && (
                  <li>
                    <a
                      href={`https://wa.me/${site.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-ink hover:text-link"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      {whatsAppDisplay()}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {hasAddress && (
            <div>
              <h2 className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
                Workshop
              </h2>
              <address className="not-italic text-sm leading-relaxed text-muted">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>

              {/*
                Map is rendered only when we hold a real address. An embedded
                map pointing at the wrong place is worse than no map — people
                turn up. See TODO-BEFORE-LAUNCH.md.
              */}
              <iframe
                title="Map showing the M.A Champions Belts workshop"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="mt-4 h-56 w-full rounded-[--radius-plate] border border-line"
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  addressLines.join(', ')
                )}&output=embed`}
              />
            </div>
          )}

          <div>
            <h2 className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Shipping
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Free to {site.shipping.freeTo.join(', ')}.
              {site.shipping.worldwide && ' We ship worldwide, quoted with your order.'}
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
