import { getTranslations } from 'next-intl/server';
import { BadgeCheck, Building2, MapPinned } from 'lucide-react';

export async function TrustBar({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'TrustBar' });

  const items = [
    { icon: MapPinned, value: t('destinationsValue'), label: t('destinations') },
    { icon: Building2, value: t('partnersValue'), label: t('partners') },
    { icon: BadgeCheck, value: t('guaranteeValue'), label: t('guarantee') },
  ];

  return (
    <section className="border-y bg-secondary/50">
      <div className="container-page grid grid-cols-1 gap-8 py-8 sm:grid-cols-3">
        {items.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex items-center justify-center gap-4 sm:justify-start"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}