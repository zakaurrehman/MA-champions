import Link from 'next/link';

/**
 * Belt plate mark.
 *
 * The silhouette is a championship centre plate — scalloped shoulders, a
 * tapered base and a beaded inner rule — so the mark reads as "belt maker"
 * rather than "sports team". Drawn as SVG so it stays crisp at every size,
 * inherits theme colour, and can be reproduced in a single colour for
 * embroidery, stamping or an embossed box.
 */

export function PlateMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="M.A Champions Belts plate mark">
      <defs>
        <linearGradient id="ma-plate-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-gold-lo)" />
          <stop offset="32%" stopColor="var(--color-gold)" />
          <stop offset="52%" stopColor="var(--color-gold-hi)" />
          <stop offset="72%" stopColor="var(--color-gold)" />
          <stop offset="100%" stopColor="var(--color-gold-lo)" />
        </linearGradient>
      </defs>

      {/* Outer plate: scalloped shoulders tapering to a point. */}
      <path
        d="M24 2.5c5.2 0 9.1 1.4 12.4 2.6 2.6 1 5 1.3 7.1 1.1.6 2.4.9 5 .9 7.7 0 12.6-7.4 24.1-20.4 31.6a1 1 0 0 1-1 0C10 38 2.6 26.5 2.6 13.9c0-2.7.3-5.3.9-7.7 2.1.2 4.5-.1 7.1-1.1C13.9 3.9 18.8 2.5 24 2.5Z"
        fill="url(#ma-plate-gold)"
      />

      {/* Inner field, so the monogram sits on plate rather than on gold. */}
      <path
        d="M24 6.6c4.4 0 7.8 1.2 10.7 2.2 2 .8 3.9 1.1 5.6 1.1.4 1.8.6 3.7.6 5.6 0 10.6-6.2 20.3-16.9 26.7-10.7-6.4-16.9-16.1-16.9-26.7 0-1.9.2-3.8.6-5.6 1.7 0 3.6-.3 5.6-1.1C16.2 7.8 19.6 6.6 24 6.6Z"
        fill="var(--color-primary)"
      />

      {/* Beaded inner rule. */}
      <path
        d="M24 9.4c3.9 0 6.9 1.1 9.5 2 1.5.5 3 .8 4.3.9.3 1.4.4 2.9.4 4.4 0 9.2-5.3 17.6-14.2 23.3C15.1 34.3 9.8 25.9 9.8 16.7c0-1.5.1-3 .4-4.4 1.3-.1 2.8-.4 4.3-.9 2.6-.9 5.6-2 9.5-2Z"
        fill="none"
        stroke="var(--color-gold-hi)"
        strokeWidth="0.9"
        opacity="0.8"
      />

      {/* M · A monogram */}
      <text
        x="24"
        y="24.5"
        textAnchor="middle"
        fill="var(--color-gold-hi)"
        fontSize="12.5"
        fontFamily="var(--font-display)"
        letterSpacing="0.5"
      >
        MA
      </text>

      {/* Base rule, echoing a nameplate. */}
      <rect x="17" y="28.5" width="14" height="1.6" rx="0.8" fill="var(--color-gold-hi)" opacity="0.75" />
    </svg>
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-2.5"
      aria-label="M.A Champions Belts — home"
    >
      <PlateMark
        className={`shrink-0 transition-all duration-300 ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display uppercase tracking-wide text-ink transition-all duration-300 ${
            compact ? 'text-sm' : 'text-base'
          }`}
        >
          M.A Champions
        </span>
        <span className="font-body text-2xs uppercase tracking-[0.28em] text-subtle">
          Belts
        </span>
      </span>
    </Link>
  );
}
