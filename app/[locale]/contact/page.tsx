import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Mail } from 'lucide-react';
import { localizedMetadata } from '@/lib/metadata';
import { siteConfig } from '@/lib/site';
import { ContactForm } from '@/components/contact-form';

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Contact' });
  return localizedMetadata({
    locale,
    path: '/contact',
    title: t('title'),
    description: t('subtitle'),
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Contact' });

  return (
    <div className="container-page max-w-3xl py-12 lg:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t('title')}
      </h1>
      <p className="mt-4 text-muted-foreground">{t('subtitle')}</p>

      <a
        href={`mailto:${siteConfig.email}`}
        className="mt-6 inline-flex items-center gap-2 text-primary hover:underline"
      >
        <Mail className="h-4 w-4" />
        {siteConfig.email}
      </a>

      <div className="mt-10">
        <ContactForm />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">{t('note')}</p>
    </div>
  );
}