import PageShell from './PageShell';
import Button from './Button';

interface Props {
  eyebrow?: string;
  title: string;
  intro: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

/**
 * Interim page for routes that exist in navigation but whose full build lands
 * in a later phase.
 *
 * These are real, customer-facing pages — not developer stubs. They say what
 * the page will hold, and always route on to something that works, so no link
 * in the header or footer dead-ends during review.
 */
export default function InterimPage({
  eyebrow,
  title,
  intro,
  ctaLabel = 'Build your belt',
  ctaHref = '/build',
  secondaryLabel = 'Back to home',
  secondaryHref = '/',
}: Props) {
  return (
    <PageShell eyebrow={eyebrow} title={title} intro={intro}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button href={ctaHref} size="lg">
          {ctaLabel}
        </Button>
        <Button href={secondaryHref} variant="secondary" size="lg">
          {secondaryLabel}
        </Button>
      </div>
    </PageShell>
  );
}
