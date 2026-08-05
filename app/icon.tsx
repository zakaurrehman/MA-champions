import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/**
 * Favicon: the plate mark reduced to what survives at 32px.
 *
 * The full mark's beaded rule and scalloped shoulders turn to mud this small,
 * so this is the silhouette plus the monogram only — the same logic a real
 * die-stamp follows.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#5e141c',
          borderRadius: 6,
          color: '#f2d98b',
          fontSize: 17,
          fontWeight: 800,
          fontFamily: 'sans-serif',
          letterSpacing: -0.5,
        }}
      >
        MA
      </div>
    ),
    size
  );
}
