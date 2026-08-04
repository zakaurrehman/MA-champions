import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}

/**
 * Standard interior-page frame: page heading block plus content well.
 * Keeps every non-home route on the same rhythm as the homepage sections.
 */
export default function PageShell({ eyebrow, title, intro, children }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <header className="max-w-2xl">
        {eyebrow && (
          <p className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-nickel">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl text-bone sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 text-base leading-relaxed text-bone-dim">{intro}</p>}
      </header>
      {children && <div className="mt-12">{children}</div>}
    </div>
  );
}
