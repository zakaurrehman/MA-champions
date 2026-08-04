import Button from './Button';

interface Props {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

/**
 * Honest empty state.
 *
 * Used wherever a route exists ahead of its inventory. It says plainly that
 * nothing is listed yet and routes the visitor to the thing that DOES work
 * (the Belt Builder), rather than showing a fake grid or a dead end.
 */
export default function EmptyState({
  title,
  body,
  ctaLabel = 'Build your belt',
  ctaHref = '/build',
  className = '',
}: Props) {
  return (
    <div
      className={`border-plate flex flex-col items-center rounded-[--radius-plate] bg-ink-raised px-6 py-14 text-center ${className}`}
    >
      <span aria-hidden="true" className="mb-5 block h-px w-16 bg-plated" />
      <h3 className="text-xl text-bone">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-bone-dim">{body}</p>
      <Button href={ctaHref} variant="secondary" className="mt-7">
        {ctaLabel}
      </Button>
    </div>
  );
}
