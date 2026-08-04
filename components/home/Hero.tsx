import Image from 'next/image';
import Button from '@/components/ui/Button';
import { site } from '@/lib/site';

/**
 * Hero — display case under a spotlight.
 *
 * The brief calls for one belt lit against black. We do not yet hold a
 * launch-safe hero photograph: all 24 supplied photos show live third-party
 * marks and were scoped to the custom gallery only (see PLACEHOLDER-IMAGES.md).
 *
 * So this renders the lit-plinth treatment with a typographic centrepiece, and
 * upgrades to a photographic hero the moment one exists — set HERO_IMAGE and
 * nothing else changes.
 */
const HERO_IMAGE: { src: string; alt: string } | null = null; // TODO: client hero shot

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-canvas" aria-labelledby="hero-title">
      {/* Spotlight: a single cone falling on the plinth. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, var(--color-gold-hi) 22%, transparent) 0%, color-mix(in srgb, var(--color-gold) 8%, transparent) 28%, transparent 62%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56"
        style={{
          background:
            'linear-gradient(to top, color-mix(in srgb, var(--color-primary) 16%, transparent), transparent)',
        }}
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-2 lg:items-center lg:gap-8 lg:pb-28 lg:pt-24">
        {/* Copy */}
        <div className="reveal max-w-xl">
          <p className="mb-5 font-body text-2xs font-semibold uppercase tracking-[0.24em] text-subtle">
            In-house manufacturing · Worldwide shipping
          </p>

          <h1
            id="hero-title"
            className="text-4xl leading-[0.92] text-ink sm:text-5xl lg:text-6xl"
          >
            Custom championship
            <br />
            belts, <span className="text-plated">built by hand</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Real cowhide. Deep-etched metal. True 24k gold plating. Every belt is cut,
            plated and stitched in our own workshop — replica title belts, custom designs,
            boxing, MMA and fantasy league trophies.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button href="/build" size="lg">
              Build Your Belt
            </Button>
            <Button href="/collections" variant="secondary" size="lg">
              Shop Collections
            </Button>
          </div>

          {site.claims.freeDigitalProof && (
            <p className="mt-7 text-2xs uppercase tracking-[0.16em] text-subtle">
              Free design proof before production
            </p>
          )}
        </div>

        {/* Plinth */}
        <div className="relative">
          <div className="border-plate plate-sheen relative aspect-[4/3] overflow-hidden rounded-[--radius-plate] bg-surface">
            {HERO_IMAGE ? (
              <Image
                src={HERO_IMAGE.src}
                alt={HERO_IMAGE.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="leather-grain grid h-full place-items-center px-6 text-center">
                <div>
                  <span
                    aria-hidden="true"
                    className="mx-auto mb-6 block h-px w-24 bg-plated"
                  />
                  <p className="font-display text-2xl uppercase leading-none text-ink sm:text-3xl">
                    24k gold over
                    <br />
                    <span className="text-plated">deep-etched metal</span>
                  </p>
                  <p className="mx-auto mt-5 max-w-xs text-sm leading-relaxed text-muted">
                    4mm and 6mm plates, machine-cut from solid stock and set on
                    sealed-edge cowhide.
                  </p>
                  <span
                    aria-hidden="true"
                    className="mx-auto mt-6 block h-px w-24 bg-plated"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reflection under the plinth */}
          <div
            aria-hidden="true"
            className="mx-auto h-16 w-[86%] rounded-b-full"
            style={{
              background:
                'radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--color-gold) 18%, transparent), transparent 70%)',
            }}
          />
        </div>
      </div>
    </section>
  );
}
