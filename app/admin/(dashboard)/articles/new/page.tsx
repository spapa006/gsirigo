import type { Metadata } from 'next';
import { listDestinationSlugs } from '@/lib/db/repositories/destinations';
import { ArticleForm } from '@/components/admin/article-form';
import { LocaleTabs } from '@/components/admin/locale-tabs';

export const metadata: Metadata = { title: 'New article' };

type Props = { searchParams: Promise<{ locale?: string }> };

export default async function NewArticlePage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = params.locale ?? 'en';
  const destinationSlugs = await listDestinationSlugs('en');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">New article</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a slug and locale, write the MDX body, then save.
        </p>
      </header>

      <LocaleTabs locale={locale} baseHref="/admin/articles/new" />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <ArticleForm initial={null} destinationSlugs={destinationSlugs} />
      </div>
    </div>
  );
}