import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Global 404 page for unmatched routes across the whole app
    globalNotFound: true,
  },
  images: {
    // Draft placeholder images. Replace with your own photography/Unsplash at launch.
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

// Links next-intl to ./i18n/request.ts
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);