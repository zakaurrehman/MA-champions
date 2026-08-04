'use client';

import { useId } from 'react';
import type { BuildState } from '@/lib/builder';
import {
  LEATHER_EDGE,
  LEATHER_HEX,
  PLATE_GRADIENTS,
  SILHOUETTE_PATHS,
  sidePlateOffsets,
  stitchColour,
} from './beltPaths';

/**
 * Live belt preview.
 *
 * Drawn parametrically rather than composited from fixed images, so leather
 * colour, stitching, plate finish, plate count and silhouette all change
 * visibly and instantly — and adding a seventh silhouette later is one path
 * string, not a new asset set.
 */

const STRAP =
  'M0,168 C220,146 420,138 700,138 C980,138 1180,146 1400,168 L1400,252 C1180,274 980,282 700,282 C420,282 220,274 0,252 Z';

export default function BeltPreview({ build }: { build: BuildState }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `plate-${uid}`;
  const clipId = `art-${uid}`;

  const leather = LEATHER_HEX[build.leather];
  const edge = LEATHER_EDGE[build.leather];
  const thread = stitchColour(build.stitch, build.leather);
  const stops = PLATE_GRADIENTS[build.plateMaterial];
  const path = SILHOUETTE_PATHS[build.silhouette];
  const sides = sidePlateOffsets(build.plateCount);

  const engraving = build.engraving.trim();

  return (
    <svg
      viewBox="0 0 1400 420"
      className="h-auto w-full"
      role="img"
      aria-label={`Preview of a ${build.silhouette.replace('-', ' ')} championship belt with ${
        build.plateCount
      } ${build.plateMaterial.replace('-', ' ')} plates on a ${build.leather} leather strap`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          {stops.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>

        {/* Artwork is clipped to the centre plate so it never bleeds off it. */}
        <clipPath id={clipId}>
          <path d={path} transform="translate(700 210) scale(0.62)" />
        </clipPath>
      </defs>

      {/* Strap */}
      <path d={STRAP} fill={leather} />
      <path d={STRAP} fill="none" stroke={edge} strokeWidth="6" />
      {/* Stitch line, inset from the edge */}
      <path
        d={STRAP}
        fill="none"
        stroke={thread}
        strokeWidth="2.5"
        strokeDasharray="10 9"
        transform="translate(700 210) scale(0.965) translate(-700 -210)"
        opacity="0.9"
      />

      {/* Snap studs on the tails */}
      {[60, 110, 1290, 1340].map((x) => (
        <circle key={x} cx={x} cy="210" r="8" fill={edge} stroke={thread} strokeWidth="1.5" />
      ))}

      {/* Side plates — the same silhouette, scaled down */}
      {sides.map((dx) => (
        <g key={dx} transform={`translate(${700 + dx} 210) scale(0.42)`}>
          <path d={path} fill={`url(#${gradId})`} stroke={edge} strokeWidth="3" />
          <path
            d={path}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.28"
            transform="scale(0.7)"
          />
        </g>
      ))}

      {/* Centre plate */}
      <g transform="translate(700 210)">
        <path d={path} fill={`url(#${gradId})`} stroke={edge} strokeWidth="3.5" />
        {/* Inner rule */}
        <path
          d={path}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          opacity="0.3"
          transform="scale(0.78)"
        />
      </g>

      {/* Uploaded artwork, if any */}
      {build.artwork?.previewUrl && (
        <image
          href={build.artwork.previewUrl}
          x="580"
          y="90"
          width="240"
          height="240"
          preserveAspectRatio="xMidYMid meet"
          clipPath={`url(#${clipId})`}
        />
      )}

      {/* Nameplate engraving */}
      {engraving && (
        <g transform="translate(700 268)">
          <rect
            x={-Math.min(150, 12 + engraving.length * 8.5)}
            y="-16"
            width={Math.min(300, 24 + engraving.length * 17)}
            height="32"
            rx="4"
            fill={edge}
            opacity="0.92"
          />
          <text
            x="0"
            y="6"
            textAnchor="middle"
            fill={stops[2]?.color ?? '#f4dc94'}
            fontSize="19"
            fontFamily="var(--font-display)"
            letterSpacing="1.5"
          >
            {engraving.toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
}
