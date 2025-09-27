const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Import Blossom configuration for dynamic domain configuration
// Note: Using require with .js extension for Next.js compatibility
const { getAllBlossomDomains } = require('./src/config/blossom');

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
      // Dynamic Blossom domains from configuration
      ...getAllBlossomDomains().map(hostname => ({
        protocol: 'https',
        hostname,
        pathname: '**',
      })),
      // Legacy image hosts
      {
        protocol: 'https',
        hostname: 'image.nostr.build',
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
