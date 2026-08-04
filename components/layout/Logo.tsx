import Link from 'next/link';

/**
 * Wordmark lockup.
 *
 * TODO: the lion-crest logo was shared in chat but no file has landed in the
 * repo yet. Drop it at `public/brand/logo.svg` and swap this for next/image.
 * Until then this renders as a typographic lockup — deliberate, not a stand-in
 * graphic, so nothing placeholder-looking ships.
 */
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-2.5"
      aria-label="M.A Champions Belts — home"
    >
      <span
        aria-hidden="true"
        className={`bg-plated grid place-items-center rounded-[--radius-plate] font-display leading-none text-ink transition-all duration-300 ${
          compact ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-lg'
        }`}
      >
        MA
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-display uppercase tracking-wide text-bone transition-all duration-300 ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          M.A Champions
        </span>
        <span className="font-body text-2xs uppercase tracking-[0.28em] text-nickel">
          Belts
        </span>
      </span>
    </Link>
  );
}
