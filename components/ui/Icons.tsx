import type { SVGProps } from 'react';

/**
 * Inline icon set — no icon library dependency, so nothing ships to the client
 * that we do not use. All are 24×24, 1.5 stroke, currentColor.
 */

type P = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const HeartIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9Z" />
  </svg>
);

export const CartIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.55L20.5 8H6" />
    <circle cx="10" cy="20" r="1.2" />
    <circle cx="17" cy="20" r="1.2" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const ChevronDownIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const WhatsAppIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.88 9.88 0 0 0 12.04 2Zm0 1.68c2.2 0 4.28.86 5.84 2.42a8.22 8.22 0 0 1 2.42 5.86c0 4.56-3.7 8.28-8.26 8.28a8.2 8.2 0 0 1-4.2-1.16l-.3-.18-3.12.82.84-3.04-.2-.32a8.2 8.2 0 0 1-1.26-4.4c0-4.56 3.7-8.28 8.24-8.28Zm-2.5 4.44c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.68 2.66 4.12 3.6 2.02.78 2.44.62 2.88.58.44-.04 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12s-.62.78-.76.94c-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.42-1.34-1.66-.14-.24-.02-.38.1-.5.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46Z" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="m12 3.5 2.6 5.27 5.82.85-4.21 4.1.99 5.78L12 16.77l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85L12 3.5Z" />
  </svg>
);

/* -- "Why us" icons -- */

export const FactoryIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 20h18M4 20V10l5 3V10l5 3V6l5 3v11" />
    <path d="M8 20v-3.5M13 20v-3.5M18 20v-3.5" />
  </svg>
);

export const HideIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 6.5c2-2 4-1 5-2s3.5-1.5 5 0 3 .5 4.5 2c1.2 1.2.5 3-.5 4s-1 3 0 4.5-1.5 3.5-3.5 3-3 .5-4.5.5-2.5-1.5-4-2-2.5-2-2-3.5.5-2.5 0-4 0-2 0-2.5Z" />
  </svg>
);

export const PlatingIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3 8 7.5 12 21l4-13.5L12 3Z" />
    <path d="M8 7.5h8M12 3v18" />
  </svg>
);

export const GlobeIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18Z" />
  </svg>
);
