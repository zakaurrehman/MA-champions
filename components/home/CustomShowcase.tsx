import Image from 'next/image';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import { getCustomGalleryProducts } from '@/lib/products';

/**
 * Custom work showcase — real belts we have built, presented as commissions.
 *
 * These carry client-supplied plate artwork and are intentionally not
 * purchasable, so they link to /custom rather than a product page.
 */
export default async function CustomShowcase() {
  const builds = (await getCustomGalleryProducts()).slice(0, 4);
  if (builds.length === 0) return null;

  return (
    <section
      className="leather-grain border-t border-ink-line py-16 sm:py-20"
      aria-labelledby="custom-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Custom work"
          title="Built to a customer's spec"
          titleId="custom-title"
          intro="Commissions from our benches. Bring us artwork, a logo or a rough sketch and we will build to it."
          action={<Button href="/build">Start your design</Button>}
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {builds.map((build, i) => {
            const img = build.images[0];
            return (
              <li key={build.id}>
                <figure className="border-plate plate-sheen group h-full overflow-hidden rounded-[--radius-plate] bg-ink-raised">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {img && (
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        placeholder={img.blurDataURL ? 'blur' : 'empty'}
                        blurDataURL={img.blurDataURL}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        priority={i === 0}
                      />
                    )}
                  </div>
                  <figcaption className="p-5">
                    <h3 className="font-body text-sm font-semibold uppercase tracking-wide text-bone">
                      {build.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-bone-dim">
                      {build.specs.plateThickness} CNC · {build.specs.plateCount} plates ·{' '}
                      {build.specs.stones === 'None' ? 'No stones' : 'Stone set'}
                    </p>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-2xs leading-relaxed text-nickel">
          Commissioned pieces built to customer-supplied artwork. Shown as examples of our
          work — not for sale.
        </p>
      </div>
    </section>
  );
}
