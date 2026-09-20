import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { getAllArticles } from '@/lib/db/repositories/articles';
import { Link } from '@/i18n/navigation';
import { ArticleCard } from '@/components/article-card';
import { buttonVariants } from '@/components/ui/button';

export async function LatestArticles({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'LatestArticles' });
  const articles = (await getAllArticles(locale)).slice(0, 4);

  if (articles.length === 0) return null;

  return (
    <section className="container-page py-16 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link
          href="/articles"
          className={buttonVariants({ variant: 'outline' })}
        >
          {t('viewAll')}
          <ArrowRight />
        </Link>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}