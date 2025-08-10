/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental options removed to fix Next.js config warning
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
};

module.exports = nextConfig;
