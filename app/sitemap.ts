import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { listArticleSlugs } from '@/lib/db/repositories/articles';
import { listDestinationSlugs } from '@/lib/db/repositories/destinations';
import { getLegalSlugs } from '@/lib/content';
import { getSettings } from '@/lib/db/repositories/settings';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();
  const SITE_URL = settings.siteUrl;

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

    // Articles (published only, DB-driven)
    for (const slug of await listArticleSlugs(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/articles/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // Destinations
    for (const slug of await listDestinationSlugs(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/destinations/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }

    // Legal pages (static MDX)
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