import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        // Images uploaded through the admin panel are served from Vercel Blob,
        // not from public/. Without this, next/image refuses every one of them
        // with "hostname is not configured" and the whole catalogue goes blank
        // the moment a photo is uploaded rather than committed.
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
