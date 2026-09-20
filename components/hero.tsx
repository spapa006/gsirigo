import { getTranslations } from 'next-intl/server';
import { BadgeCheck } from 'lucide-react';
import { CarRentalWidget } from '@/components/car-rental-widget';
import { Badge } from '@/components/ui/badge';

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'Hero' });
  const trustKeys = ['trust0', 'trust1', 'trust2'] as const;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 via-white to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(13,148,136,0.12),transparent_60%)]"
      />
      <div className="container-page relative py-14 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs sm:text-sm">
            {t('badge')}
          </Badge>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
            {t('subtitle')}
          </p>
        </div>

        {/* The single most important conversion element */}
        <div className="mx-auto mt-10 max-w-2xl">
          <CarRentalWidget />
        </div>

        <ul className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {trustKeys.map((key) => (
            <li key={key} className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-primary" />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}