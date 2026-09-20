import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticleRow } from '@/lib/db/repositories/articles';
import { listDestinationSlugs } from '@/lib/db/repositories/destinations';
import { ArticleForm } from '@/components/admin/article-form';
import { LocaleTabs } from '@/components/admin/locale-tabs';

export const metadata: Metadata = { title: 'Edit article' };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
};

export default async function EditArticlePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = sp.locale ?? 'en';

  const row = await getArticleRow(locale, slug);
  if (!row) notFound();

  const destinationSlugs = await listDestinationSlugs('en');

  const initial = {
    slug: row.slug,
    locale: row.locale,
    status: row.status,
    title: row.title,
    excerpt: row.excerpt,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    image: row.image,
    date: row.date,
    readingTime: row.readingTime,
    destination: row.destination ?? '',
    widgetPartner: row.widgetPartner ?? '',
    widgetCity: row.widgetCity ?? '',
    widgetCountry: row.widgetCountry ?? '',
    body: row.body,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Edit article</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{slug}</p>
        </div>
        <Link href="/admin/articles" className="text-sm font-medium text-teal-700 hover:underline">
          ← Back to list
        </Link>
      </header>

      <LocaleTabs locale={locale} baseHref={`/admin/articles/${slug}`} />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <ArticleForm initial={initial} destinationSlugs={destinationSlugs} />
      </div>
    </div>
  );
}