import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';

export const alt = 'M.A Champions Belts — custom championship belts, built by hand';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Default social share card, rendered at build time.
 *
 * Satori (behind ImageResponse) is not a browser, and two of its limits bit
 * here:
 *  1. SVG <text> is unsupported — the monogram is an overlaid HTML div.
 *  2. Any glyph outside the bundled font triggers a network font fetch, which
 *     fails during a build. So separators are plain divs, not "◆" characters.
 * It also has no background-clip:text, so the site's gold gradient is
 * approximated with a solid plated tone rather than rendering transparent.
 */
export default function OpengraphImage() {
  const separator = (
    <div
      style={{
        width: 7,
        height: 7,
        backgroundColor: '#5e141c',
        transform: 'rotate(45deg)',
      }}
    />
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0c0a08',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #2a1c0d 0%, #0c0a08 55%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Plate mark: SVG paths only, monogram overlaid as HTML. */}
        <div style={{ display: 'flex', position: 'relative', width: 132, height: 132 }}>
          <svg width="132" height="132" viewBox="0 0 48 48">
            <path
              d="M24 2.5c5.2 0 9.1 1.4 12.4 2.6 2.6 1 5 1.3 7.1 1.1.6 2.4.9 5 .9 7.7 0 12.6-7.4 24.1-20.4 31.6a1 1 0 0 1-1 0C10 38 2.6 26.5 2.6 13.9c0-2.7.3-5.3.9-7.7 2.1.2 4.5-.1 7.1-1.1C13.9 3.9 18.8 2.5 24 2.5Z"
              fill="#c9962e"
            />
            <path
              d="M24 6.6c4.4 0 7.8 1.2 10.7 2.2 2 .8 3.9 1.1 5.6 1.1.4 1.8.6 3.7.6 5.6 0 10.6-6.2 20.3-16.9 26.7-10.7-6.4-16.9-16.1-16.9-26.7 0-1.9.2-3.8.6-5.6 1.7 0 3.6-.3 5.6-1.1C16.2 7.8 19.6 6.6 24 6.6Z"
              fill="#5e141c"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 132,
              height: 132,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f2d98b',
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            MA
          </div>
        </div>

        <div
          style={{
            marginTop: 38,
            fontSize: 70,
            fontWeight: 800,
            letterSpacing: -1,
            color: '#f2d98b',
            textTransform: 'uppercase',
          }}
        >
          {site.name}
        </div>

        <div style={{ marginTop: 16, fontSize: 30, color: '#a89f90', letterSpacing: 1 }}>
          {site.tagline}
        </div>

        <div
          style={{
            marginTop: 46,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontSize: 21,
            color: '#8b8377',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          <span>Custom</span>
          {separator}
          <span>Replica</span>
          {separator}
          <span>Boxing</span>
          {separator}
          <span>MMA</span>
        </div>
      </div>
    ),
    size
  );
}
