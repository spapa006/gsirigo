import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import {
  getArticleSlugs,
  getLegalSlugs,
} from '@/lib/content';
import { destinations } from '@/lib/destinations';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gsirigo.com';

const staticPaths = [
  '',
  '/articles',
  '/destinations',
  '/about',
  '/contact',
  '/legal/affiliate-disclosure',
  '/legal/privacy-policy',
  '/legal/terms',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path === '' ? 1 : path.startsWith('/legal') ? 0.4 : 0.8,
      });
    }

    // Articles
    for (const slug of getArticleSlugs(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/articles/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // Destinations
    for (const destination of destinations) {
      entries.push({
        url: `${SITE_URL}/${locale}/destinations/${destination.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // Legal pages
    for (const slug of getLegalSlugs(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/legal/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      });
    }
  }

  return entries;
}