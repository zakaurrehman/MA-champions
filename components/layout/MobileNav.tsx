'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MAIN_NAV } from '@/lib/nav';
import { CloseIcon } from '@/components/ui/Icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: Props) {
  /* Lock body scroll and close on Escape while the drawer is open. */
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col border-l border-ink-line bg-ink"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-line px-5">
          <span className="font-display text-sm uppercase tracking-wide text-bone">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-10 w-10 place-items-center text-bone hover:text-gold"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
          {MAIN_NAV.map((group) => (
            <div key={group.label} className="mb-7">
              <p className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-nickel">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="block py-2 font-body text-base text-bone transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-ink-line p-5">
          <Link
            href="/build"
            onClick={onClose}
            className="bg-plated block w-full px-5 py-3.5 text-center font-display text-sm uppercase tracking-wide text-ink"
          >
            Build Your Belt
          </Link>
        </div>
      </div>
    </div>
  );
}
