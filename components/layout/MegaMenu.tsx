import Link from 'next/link';
import type { NavGroup } from '@/lib/nav';

interface Props {
  group: NavGroup;
  onNavigate?: () => void;
}

/**
 * Mega-menu panel. Purely presentational — open/close state lives in Header so
 * keyboard and pointer behaviour stay in one place.
 */
export default function MegaMenu({ group, onNavigate }: Props) {
  return (
    <div className="border-plate absolute left-1/2 top-full w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[--radius-plate] bg-ink-raised p-6 shadow-2xl shadow-black/60">
      <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {group.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className="block rounded-[--radius-plate] px-3 py-2.5 transition-colors hover:bg-ink"
            >
              <span className="block font-body text-sm font-semibold text-bone">
                {link.label}
              </span>
              {link.hint && (
                <span className="mt-0.5 block text-2xs leading-snug text-bone-dim">
                  {link.hint}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {group.href && (
        <Link
          href={group.href}
          onClick={onNavigate}
          className="mt-4 inline-block border-t border-ink-line pt-4 font-body text-xs font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-hi"
        >
          View all {group.label.replace('Shop by ', '')} →
        </Link>
      )}
    </div>
  );
}
