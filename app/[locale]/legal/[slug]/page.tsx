import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { compileMDX } from 'next-mdx-remote/rsc';
import { getTranslations } from 'next-intl/server';
import {
  getLegalMeta,
  getLegalSlugs,
  getLegalSource,
} from '@/lib/content';
import { localizedMetadata } from '@/lib/metadata';
import { routing } from '@/i18n/routing';
import { mdxComponents } from '@/components/mdx-components';

type LegalPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  // Union of legal pages available in any locale
  const slugs = new Set<string>();
  for (const locale of routing.locales) {
    for (const slug of getLegalSlugs(locale)) slugs.add(slug);
  }
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of slugs) params.push({ locale, slug });
  }
  return params;
}

export async function generateMetadata({
  params,
}: LegalPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const meta = getLegalMeta(locale, slug);
  if (!meta) return {};
  return localizedMetadata({
    locale,
    path: `/legal/${slug}`,
    title: meta.title,
    description: meta.title,
  });
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { locale, slug } = await params;
  const meta = getLegalMeta(locale, slug);
  const source = getLegalSource(locale, slug);
  if (!meta || !source) notFound();

  const { content } = await compileMDX({
    source,
    components: mdxComponents(locale),
  });

  const t = await getTranslations({ locale, namespace: 'Legal' });

  return (
    <article className="container-page max-w-3xl py-12 lg:py-16">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        {meta.title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {t('updated')}: {meta.updated}
      </p>

      <div className="prose prose-slate mt-10 max-w-none dark:prose-invert">
        {content}
      </div>
    </article>
  );
}