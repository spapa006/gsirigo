import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Global 404 page for unmatched routes across the whole app
    globalNotFound: true,
  },
  images: {
    // Free-to-use travel photos served from the Unsplash CDN. To self-host
    // later, drop files under public/images and remove this remotePatterns block.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

// Links next-intl to ./i18n/request.ts
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);