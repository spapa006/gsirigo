import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAllArticles } from '@/lib/db/repositories/articles';
import { localizedMetadata } from '@/lib/metadata';
import { ArticleCard } from '@/components/article-card';

type ArticlesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ArticlesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ArticlesPage' });
  return localizedMetadata({
    locale,
    path: '/articles',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function ArticlesPage({ params }: ArticlesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ArticlesPage' });
  const articles = await getAllArticles(locale);

  return (
    <div className="container-page py-12 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}