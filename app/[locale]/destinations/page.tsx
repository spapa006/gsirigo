import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { destinations, getLocalizedDestination } from '@/lib/destinations';
import { localizedMetadata } from '@/lib/metadata';
import { DestinationCard } from '@/components/destination-card';

type DestinationsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: DestinationsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'DestinationsPage' });
  return localizedMetadata({
    locale,
    path: '/destinations',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function DestinationsPage({
  params,
}: DestinationsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'DestinationsPage' });

  const items = destinations
    .slice()
    .sort((a, b) => a.weight - b.weight)
    .map((d) => {
      const localized = getLocalizedDestination(d.slug, locale);
      return localized ? { destination: d, localized: localized.localized } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="container-page py-12 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ destination, localized }) => (
          <DestinationCard
            key={destination.slug}
            destination={destination}
            localized={localized}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}