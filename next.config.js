const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const baseConfig = {
  // experimental options removed to fix Next.js config warning
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.blossom.band',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.blosstr.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'image.nostr.build',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'blossom.nostr.build',
        pathname: '**',
      },
    ],
  },
  // Re-enable ESLint during builds now that cleanup is in progress.
  eslint: {
    ignoreDuringBuilds: false,
  },
};
module.exports = withBundleAnalyzer(baseConfig);
