'use client';

/**
 * Last-resort boundary: catches failures in the root layout itself.
 *
 * This REPLACES <html> and <body>, so it cannot use the site's layout,
 * components or Tailwind classes — the stylesheet may be exactly what failed.
 * Everything here is therefore inline and self-contained by necessity.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f7f4ef',
          color: '#1a1714',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 1.5rem',
              borderRadius: 6,
              background: '#5e141c',
              color: '#f2d98b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}
          >
            MA
          </div>

          <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.75rem', letterSpacing: '-0.01em' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b6259', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            The page failed to load. Please try again.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              background: '#5e141c',
              color: '#fbf7f0',
              border: 'none',
              borderRadius: 3,
              padding: '0.85rem 1.75rem',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>

          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#8c8378' }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
