import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { localizedMetadata } from '@/lib/metadata';
import { siteUrl } from '@/lib/site';
import { JsonLd } from '@/components/json-ld';
import { Hero } from '@/components/hero';
import { TrustBar } from '@/components/trust-bar';
import { HowItWorks } from '@/components/how-it-works';
import { PopularDestinations } from '@/components/popular-destinations';
import { LatestArticles } from '@/components/latest-articles';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Meta' });
  return localizedMetadata({
    locale,
    path: '/',
    title: t('title'),
    description: t('description'),
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Gsirigo',
    url: siteUrl('/'),
    logo: siteUrl('/icon.svg'),
    description: 'Compare and book cheap car rentals worldwide.',
    sameAs: [
      'https://x.com/gsirigo',
      'https://instagram.com/gsirigo',
      'https://facebook.com/gsirigo',
    ],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Gsirigo',
    url: siteUrl('/'),
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <Hero locale={locale} />
      <TrustBar locale={locale} />
      <HowItWorks locale={locale} />
      <PopularDestinations locale={locale} />
      <LatestArticles locale={locale} />
    </>
  );
}