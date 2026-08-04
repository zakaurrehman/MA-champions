'use client';

interface Props {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPage }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="border-plate rounded-[--radius-plate] px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.14em] text-bone transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-40"
      >
        Previous
      </button>

      <ul className="flex items-center gap-1">
        {pages.map((n) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`grid h-10 w-10 place-items-center rounded-[--radius-plate] font-body text-sm tabular-nums transition-colors ${
                n === page
                  ? 'bg-plated text-ink'
                  : 'border border-nickel/25 text-bone hover:border-gold hover:text-gold'
              }`}
            >
              {n}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="border-plate rounded-[--radius-plate] px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.14em] text-bone transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
