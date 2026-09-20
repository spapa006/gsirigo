import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { localizedMetadata } from '@/lib/metadata';
import { JsonLd } from '@/components/json-ld';
import { siteUrl } from '@/lib/site';
import { siteConfig } from '@/lib/site';

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'About' });
  return localizedMetadata({
    locale,
    path: '/about',
    title: t('title'),
    description: t('subtitle'),
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'About' });

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Gsirigo',
    url: siteUrl('/about'),
    email: siteConfig.email,
    description: t('subtitle'),
  };

  const sections = [
    { title: t('missionTitle'), body: t('missionBody') },
    { title: t('howTitle'), body: t('howBody') },
    { title: t('trustTitle'), body: t('trustBody') },
  ];

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <div className="container-page max-w-3xl py-12 lg:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-bold tracking-tight">
                {section.title}
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}