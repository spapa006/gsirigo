import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Check, CornerUpLeft } from 'lucide-react';
import {
  getManagedDestination,
  listDestinationSlugs,
} from '@/lib/db/repositories/destinations';
import { getAllArticles } from '@/lib/db/repositories/articles';
import { localizedMetadata } from '@/lib/metadata';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { WidgetHost } from '@/components/widget-host';
import { CtaBlock } from '@/components/cta-block';
import { Badge } from '@/components/ui/badge';
import { ArticleCard } from '@/components/article-card';

type DestinationPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of await listDestinationSlugs(locale)) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: DestinationPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getManagedDestination(slug, locale);
  if (!data) return {};
  const { localized } = data;
  const t = await getTranslations({ locale, namespace: 'DestinationPage' });
  return localizedMetadata({
    locale,
    path: `/destinations/${slug}`,
    title: t('metaTitle', { city: localized.name }),
    description: t('metaDescription', {
      city: localized.name,
      country: localized.country,
    }),
  });
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { locale, slug } = await params;
  const data = await getManagedDestination(slug, locale);
  if (!data) notFound();
  const { localized } = data;
  const t = await getTranslations({ locale, namespace: 'DestinationPage' });

  const allArticles = await getAllArticles(locale);
  const relatedArticles = allArticles
    .filter((a) => a.meta.destination === slug)
    .slice(0, 3);

  return (
    <>
      <article>
        {/* Hero */}
        <section className="relative">
          <div className="relative h-64 w-full overflow-hidden sm:h-80">
            <Image
              src={data.image}
              alt={localized.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>

          <div className="container-page relative -mt-24 pb-4">
            <div className="rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
              <Link
                href="/destinations"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <CornerUpLeft className="h-4 w-4" />
                {t('backToDestinations')}
              </Link>

              <div className="mt-4 grid gap-8 lg:grid-cols-2">
                <div>
                  <Badge variant="secondary">{localized.country}</Badge>
                  <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {t('title', { city: localized.name })}
                  </h1>
                  <p className="mt-3 text-lg text-muted-foreground">
                    {localized.tagline}
                  </p>
                  <p className="mt-4 leading-relaxed">
                    {localized.description}
                  </p>

                  <ul className="mt-6 space-y-2.5">
                    {localized.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {highlight}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 inline-block rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
                    {localized.priceFrom}
                  </p>
                </div>

                {/* Pre-filled search widget for this destination */}
                <div id="widget" className="scroll-mt-32">
                  <WidgetHost
                    locale={locale}
                    partner="rentalcars"
                    destination={localized.city}
                    country={localized.country}
                    variant="full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related guides */}
        {relatedArticles.length > 0 && (
          <section className="container-page py-14">
            <h2 className="text-2xl font-extrabold tracking-tight">
              {t('relatedArticles')}
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          </section>
        )}

        <section className="container-page pb-16">
          <CtaBlock locale={locale} href="#widget" />
        </section>
      </article>
    </>
  );
}