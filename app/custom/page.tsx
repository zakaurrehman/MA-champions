import type { Metadata } from 'next';
import Image from 'next/image';
import PageShell from '@/components/ui/PageShell';
import Button from '@/components/ui/Button';
import { getCustomGalleryProducts } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Custom Championship Belts — Built To Your Design',
  description:
    'Custom wrestling belts, corporate award belts and fantasy league trophies built to your artwork by M.A Champions Belts.',
  alternates: { canonical: '/custom' },
};

/*
 * Process copy describes only what the work inherently involves. Specific
 * promises — proof turnaround, packaging, tracked shipping — are gated behind
 * `site.claims` and stay out until the client confirms them.
 */
const PROCESS = [
  { step: '01', title: 'Design', body: 'Send artwork, a logo or a sketch and we work it up into a plate design.' },
  { step: '02', title: 'Approve', body: 'You review the design and confirm it before production starts.' },
  { step: '03', title: 'Manufacture', body: 'Plates are machined, plated and set onto the leather by hand.' },
  { step: '04', title: 'Ship', body: 'Packed and shipped worldwide.' },
] as const;

export default async function CustomPage() {
  const builds = await getCustomGalleryProducts();

  return (
    <PageShell
      eyebrow="Custom work"
      title="Built to your design"
      intro="Bring us artwork, a logo, or a rough idea on paper. We build championship belts for promotions, gyms, fantasy leagues, corporate awards and one-off gifts."
    >
      <section aria-labelledby="process">
        <h2 id="process" className="sr-only">
          Our process
        </h2>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p) => (
            <li key={p.step} className="border-plate rounded-[--radius-plate] bg-surface p-6">
              <span className="font-display text-2xl text-plated">{p.step}</span>
              <h3 className="mt-3 font-body text-base font-semibold uppercase tracking-wide text-ink">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {builds.length > 0 && (
        <section aria-labelledby="gallery" className="mt-16">
          <h2 id="gallery" className="text-2xl text-ink">
            Belts we have built
          </h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {builds.map((build) => {
              const img = build.images[0];
              return (
                <li key={build.id}>
                  <figure className="border-plate h-full overflow-hidden rounded-[--radius-plate] bg-surface">
                    <div className="relative aspect-[4/3]">
                      {img && (
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          placeholder={img.blurDataURL ? 'blur' : 'empty'}
                          blurDataURL={img.blurDataURL}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <figcaption className="p-5">
                      <h3 className="font-body text-sm font-semibold uppercase tracking-wide text-ink">
                        {build.name}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {build.shortDescription}
                      </p>
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-2xs leading-relaxed text-subtle">
            Commissioned pieces built to customer-supplied artwork. Shown as examples of our
            work — not for sale.
          </p>
        </section>
      )}

      <div className="mt-14 flex flex-col gap-3 sm:flex-row">
        <Button href="/build" size="lg">
          Start your design
        </Button>
        <Button href="/contact" variant="secondary" size="lg">
          Talk to us
        </Button>
      </div>
    </PageShell>
  );
}
