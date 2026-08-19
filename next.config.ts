import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    /*
     * Vercel's image optimizer is METERED. Every product photo at every layout
     * width is a separate billed transformation, and this catalogue — 17 belts
     * with roughly eight photos each — exhausted the allowance. Once it runs
     * out, /_next/image returns 402 and EVERY image on the site disappears,
     * including ones that were working yesterday.
     *
     * So images are optimised once, at upload time, instead of on every
     * request: lib/prepareImage.ts downscales to 1600px WebP in the browser
     * before the file ever reaches Blob storage, and the photos committed
     * under public/products are already web-sized. Serving them as-is costs
     * nothing and cannot run out.
     *
     * next/image is still worth keeping around this: it lazy-loads and it
     * reserves layout space, which is what actually prevents content shift.
     * Only the resizing and format conversion are skipped.
     *
     * If the account ever moves to a plan with enough transformations, delete
     * this one line to turn optimisation back on — nothing else depends on it.
     */
    unoptimized: true,

    // Kept so remote images still resolve if the line above is ever removed.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
