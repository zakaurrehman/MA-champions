import type { ReactNode } from 'react';

interface Props {
  /** Small nickel eyebrow above the title. */
  eyebrow?: string;
  title: string;
  /**
   * Required whenever the parent <section> uses aria-labelledby — without it
   * the reference dangles and the section has no accessible name.
   */
  titleId?: string;
  intro?: string;
  /** Heading level — keeps the document outline semantic per page. */
  as?: 'h2' | 'h3';
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  titleId,
  intro,
  as: Tag = 'h2',
  align = 'left',
  action,
  className = '',
}: Props) {
  const centred = align === 'center';

  return (
    <div
      className={`flex flex-col gap-4 ${
        centred ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'
      } ${className}`}
    >
      <div className={`max-w-2xl ${centred ? 'mx-auto' : ''}`}>
        {eyebrow && (
          <p className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
            {eyebrow}
          </p>
        )}
        <Tag id={titleId} className="text-3xl text-ink sm:text-4xl">
          {title}
        </Tag>
        {intro && <p className="mt-4 text-base leading-relaxed text-muted">{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
