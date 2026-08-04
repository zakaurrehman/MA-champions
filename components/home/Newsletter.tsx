import Button from '@/components/ui/Button';

/**
 * Newsletter / giveaway panel.
 *
 * TODO: no mailing provider is connected yet, and no giveaway terms have been
 * supplied. Rather than render an input that silently discards addresses — or
 * promise a prize we cannot describe — this routes to the Belt Builder, which
 * does capture a real spec. Swap in the signup form once a provider exists and
 * the client confirms the giveaway mechanics.
 */
export default function Newsletter() {
  return (
    <section className="border-t border-line py-16 sm:py-20" aria-labelledby="newsletter-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="border-plate relative overflow-hidden rounded-[--radius-plate] bg-surface px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(90% 60% at 50% 0%, color-mix(in srgb, var(--color-gold) 14%, transparent), transparent 65%)',
            }}
          />

          <div className="relative mx-auto max-w-xl">
            <p className="mb-4 font-body text-2xs font-semibold uppercase tracking-[0.24em] text-subtle">
              Start a build
            </p>
            <h2 id="newsletter-title" className="text-3xl text-ink sm:text-4xl">
              Spec your belt in <span className="text-plated">two minutes</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted">
              Pick a silhouette, plates, leather and engraving, and we will come back to you
              with a written quote.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/build" size="lg">
                Build Your Belt
              </Button>
              <Button href="/contact" variant="secondary" size="lg">
                Talk to us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
