/** @type {import('next').NextConfig} */

// Hardcoded fallback so the build never produces "undefined/api/:path*"
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://mes-projet-production.up.railway.app';

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
