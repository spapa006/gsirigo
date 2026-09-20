import type { MetadataRoute } from 'next';
import { getSettings } from '@/lib/db/repositories/settings';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/go'], // admin is authed; /go are 302s
    },
    sitemap: `${settings.siteUrl}/sitemap.xml`,
  };
}