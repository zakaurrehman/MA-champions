import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Local product photography only for now. When placeholder/CDN images are
    // introduced, add their hosts here and log them in PLACEHOLDER-IMAGES.md.
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
