'use client';

import { useEffect } from 'react';
import PageShell from '@/components/ui/PageShell';
import Button from '@/components/ui/Button';

/**
 * Route-level error boundary. Keeps the header, footer and design intact
 * instead of dropping the visitor onto Next's default error screen.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: forward to an error reporter (Sentry) once one is configured.
    console.error(error);
  }, [error]);

  return (
    <PageShell
      eyebrow="Error"
      title="Something went wrong"
      intro="That is on us, not you. Try again — and if it keeps happening, message us and we will sort it out directly."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} size="lg">
          Try again
        </Button>
        <Button href="/" variant="secondary" size="lg">
          Back to home
        </Button>
      </div>

      {/* The digest is what lets us correlate a report with the server log. */}
      {error.digest && (
        <p className="mt-8 text-2xs uppercase tracking-[0.14em] text-subtle">
          Reference: {error.digest}
        </p>
      )}
    </PageShell>
  );
}
