const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const baseConfig = {
  // experimental options removed to fix Next.js config warning
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  // Re-enable ESLint during builds now that cleanup is in progress.
  eslint: {
    ignoreDuringBuilds: false,
  },
};
module.exports = withBundleAnalyzer(baseConfig);
