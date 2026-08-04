'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MAIN_NAV } from '@/lib/nav';
import Logo from './Logo';
import MegaMenu from './MegaMenu';
import MobileNav from './MobileNav';
import AnnouncementBar from './AnnouncementBar';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { CartIcon, ChevronDownIcon, HeartIcon, MenuIcon, SearchIcon } from '@/components/ui/Icons';

export default function Header() {
  const [condensed, setCondensed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  /* Condense on scroll. Passive listener, rAF-throttled. */
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setCondensed(window.scrollY > 40);
        frame = 0;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  /* Close the mega-menu on outside click and on Escape. */
  useEffect(() => {
    if (!openGroup) return;

    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenGroup(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenGroup(null);
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [openGroup]);

  return (
    <>
      <AnnouncementBar />

      <header
        className={`sticky top-0 z-40 border-b transition-all duration-300 ${
          condensed
            ? 'border-line bg-canvas/95 backdrop-blur-md'
            : 'border-transparent bg-canvas'
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center gap-4 px-4 transition-all duration-300 sm:px-6 ${
            condensed ? 'h-14' : 'h-20'
          }`}
        >
          <Logo compact={condensed} />

          {/* Desktop nav */}
          <nav aria-label="Main" className="ml-auto hidden lg:block">
            <div ref={navRef} className="flex items-center gap-1">
              {MAIN_NAV.map((group) => {
                const isOpen = openGroup === group.label;
                return (
                  <div key={group.label} className="relative">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      onClick={() => setOpenGroup(isOpen ? null : group.label)}
                      className={`flex items-center gap-1 px-3 py-2 font-body text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                        isOpen ? 'text-link' : 'text-ink hover:text-link'
                      }`}
                    >
                      {group.label}
                      <ChevronDownIcon
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <MegaMenu group={group} onNavigate={() => setOpenGroup(null)} />
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            <ThemeToggle />
            <Link
              href="/search"
              aria-label="Search belts"
              className="grid h-10 w-10 place-items-center text-ink transition-colors hover:text-link"
            >
              <SearchIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="hidden h-10 w-10 place-items-center text-ink transition-colors hover:text-link sm:grid"
            >
              <HeartIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/cart"
              aria-label="Cart"
              className="grid h-10 w-10 place-items-center text-ink transition-colors hover:text-link"
            >
              <CartIcon className="h-5 w-5" />
            </Link>

            <Link
              href="/build"
              className="bg-primary plate-sheen ml-2 hidden shrink-0 rounded-[--radius-plate] px-4 py-2.5 font-display text-xs uppercase tracking-wide text-on-primary transition-colors hover:bg-primary-hover xl:inline-flex"
            >
              Build Your Belt
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid h-10 w-10 place-items-center text-ink transition-colors hover:text-link lg:hidden"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
