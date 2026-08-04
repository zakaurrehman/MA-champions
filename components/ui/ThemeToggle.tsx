'use client';

import { useEffect, useState } from 'react';
import type { SVGProps } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ma-theme';

const iconBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const SunIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...iconBase} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...iconBase} {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </svg>
);

/**
 * Light/dark toggle.
 *
 * The stored choice wins; with no stored choice the OS preference applies via
 * CSS. Setting `data-theme` explicitly is what lets a visitor override their
 * OS in either direction.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  /* Read the resolved theme after mount — the inline head script has already
     applied it, so this only syncs the button's label. */
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      return;
    }
    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      // Rendered before hydration too, so the header never shifts width.
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="grid h-10 w-10 place-items-center text-ink transition-colors hover:text-link"
    >
      {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}

/**
 * Runs before first paint to stop a light flash for dark-mode visitors.
 * Injected as a raw string in the document head — it must not wait for React.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;
