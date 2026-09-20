import { getTranslations } from 'next-intl/server';
import { CreditCard, ListChecks, Search } from 'lucide-react';

export async function HowItWorks({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'HowItWorks' });

  const steps = [
    { icon: Search, title: t('step1Title'), description: t('step1Desc') },
    { icon: ListChecks, title: t('step2Title'), description: t('step2Desc') },
    { icon: CreditCard, title: t('step3Title'), description: t('step3Desc') },
  ] as const;

  return (
    <section className="container-page py-16 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t('title')}
        </h2>
        <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <div
            key={title}
            className="relative rounded-2xl border bg-card p-6 text-center shadow-sm"
          >
            <span className="absolute end-4 top-4 text-5xl font-black text-border/60">
              {index + 1}
            </span>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Icon className="h-7 w-7" />
            </span>
            <h3 className="mt-5 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}