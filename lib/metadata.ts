import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

type LocalizedMetadataOptions = {
  locale: string;
  /** Path *after* the locale prefix, e.g. `/articles/cheapest-car-rental-deals` */
  path: string;
  title: string;
  description: string;
  /** JSON-LD can be injected separately via <JsonLd/>; keep this focused on HTML head */
};

/**
 * Builds metadata with a canonical URL and hreflang alternates across all
 * locales for the given path. Used on every page to guarantee proper
 * multi-language SEO signals.
 */
export function localizedMetadata({
  locale,
  path,
  title,
  description,
}: LocalizedMetadataOptions): Metadata {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gsirigo.com';

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${base}/${l}${path}`;
  }
  languages['x-default'] = `${base}/${routing.defaultLocale}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${base}/${locale}${path}`,
      languages,
    },
  };
}