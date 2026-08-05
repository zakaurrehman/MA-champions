import type { Metadata, Viewport } from 'next';
import { Anton, Archivo } from 'next/font/google';
import { site } from '@/lib/site';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { themeInitScript } from '@/components/ui/ThemeToggle';
import CartDrawer from '@/components/cart/CartDrawer';
import Toaster from '@/components/ui/Toaster';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import ExitIntentModal from '@/components/ui/ExitIntentModal';
import JsonLd from '@/components/seo/JsonLd';
import { organizationJsonLd, webSiteJsonLd } from '@/lib/seo';
import './globals.css';

/* Display: heavy condensed — the weight of an arena banner / fight poster. */
const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
  display: 'swap',
});

/* Body: clean, wide-set grotesk. Deliberately a different face, not a weight. */
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Custom & Replica Championship Belts`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: `${site.name} — Custom & Replica Championship Belts`,
    description: site.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  // Matches each theme's canvas so the browser chrome follows the site.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f4ef' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a08' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint — without this, a
            dark-mode visitor gets a white flash on every navigation. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-on-primary"
        >
          Skip to content
        </a>
        {/* Site-wide identity. Emitted once here so every page inherits it and
            page-level blocks can reference it by @id rather than repeating. */}
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={webSiteJsonLd()} />

        <Header />
        <main id="main">{children}</main>
        <Footer />

        {/* Global commerce and conversion islands. Each renders nothing until
            it has something to show, so none of them cost layout on first
            paint. WhatsAppFloat self-hides when no number is configured. */}
        <CartDrawer />
        <Toaster />
        <WhatsAppFloat />
        <ExitIntentModal />
      </body>
    </html>
  );
}
