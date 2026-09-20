import { getTranslations } from 'next-intl/server';
import { destinations, getLocalizedDestination } from '@/lib/destinations';
import { DestinationCard } from '@/components/destination-card';

export async function PopularDestinations({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'Destinations' });

  const items = destinations
    .slice()
    .sort((a, b) => a.weight - b.weight)
    .map((d) => {
      const localized = getLocalizedDestination(d.slug, locale);
      return localized ? { destination: d, localized: localized.localized } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <section className="bg-slate-50/60 py-16 lg:py-20">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </section>
  );
}