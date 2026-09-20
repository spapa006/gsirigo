import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getTranslations } from 'next-intl/server';
import { CalendarDays, Clock, CornerUpLeft } from 'lucide-react';
import {
  getArticleMeta,
  getArticleSource,
  getArticleSlugs,
} from '@/lib/content';
import { getLocalizedDestination } from '@/lib/destinations';
import { localizedMetadata } from '@/lib/metadata';
import { siteUrl } from '@/lib/site';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { mdxComponents } from '@/components/mdx-components';
import { CtaBlock } from '@/components/cta-block';
import { JsonLd } from '@/components/json-ld';
import { CarRentalWidget } from '@/components/car-rental-widget';

type ArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of getArticleSlugs(locale)) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const meta = getArticleMeta(locale, slug);
  if (!meta) return {};
  return localizedMetadata({
    locale,
    path: `/articles/${slug}`,
    title: meta.metaTitle || meta.title,
    description: meta.metaDescription || meta.excerpt,
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = await params;
  const meta = getArticleMeta(locale, slug);
  const source = getArticleSource(locale, slug);
  if (!meta || !source) notFound();

  const { content } = await compileMDX({
    source,
    components: mdxComponents(),
  });

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.metaTitle || meta.title,
    description: meta.metaDescription || meta.excerpt,
    image: meta.image,
    datePublished: meta.date,
    dateModified: meta.date,
    inLanguage: locale,
    author: {
      '@type': 'Organization',
      name: 'Gsirigo',
      url: siteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Gsirigo',
      url: siteUrl('/'),
      logo: { '@type': 'ImageObject', url: siteUrl('/icon.svg') },
    },
    mainEntityOfPage: siteUrl(`/${locale}/articles/${slug}`),
  };

  const relatedDestination = meta.destination
    ? getLocalizedDestination(meta.destination, locale)
    : null;

  const t = await getTranslations({ locale, namespace: 'ArticlePage' });

  return (
    <>
      <JsonLd data={articleJsonLd} />

      <article className="container-page max-w-3xl py-10 lg:py-14">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <CornerUpLeft className="h-4 w-4" />
          {t('backToArticles')}
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {meta.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {meta.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {meta.readingTime}
          </span>
        </div>

        <div className="prose prose-slate mt-10 max-w-none dark:prose-invert">
          {content}
        </div>

        {/* Conversion CTA at the end of every article */}
        <div className="mt-12">
          <CtaBlock locale={locale} href="/" />
        </div>
      </article>

      {relatedDestination && (
        <section className="container-page max-w-3xl pb-14">
          <h2 className="text-lg font-bold">{t('relatedDestination')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {relatedDestination.localized.tagline}
          </p>
          <div className="mt-4">
            <CarRentalWidget
              variant="mini"
              destination={relatedDestination.localized.city}
              country={relatedDestination.localized.country}
            />
          </div>
        </section>
      )}
    </>
  );
}