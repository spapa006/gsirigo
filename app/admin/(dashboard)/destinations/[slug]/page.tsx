import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDestinationRow } from '@/lib/db/repositories/destinations';
import { DestinationForm } from '@/components/admin/destination-form';
import { LocaleTabs } from '@/components/admin/locale-tabs';

export const metadata: Metadata = { title: 'Edit destination' };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
};

export default async function EditDestinationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = sp.locale ?? 'en';

  const row = await getDestinationRow(locale, slug);
  if (!row) notFound();

  const initial = {
    slug: row.slug,
    locale: row.locale,
    name: row.name,
    country: row.country,
    city: row.city,
    tagline: row.tagline,
    description: row.description,
    highlights: safeJoin(row.highlights),
    priceFrom: row.priceFrom,
    image: row.image,
    weight: row.weight,
    active: row.active,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Edit destination</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {slug} · {locale}
          </p>
        </div>
        <Link href="/admin/destinations" className="text-sm font-medium text-teal-700 hover:underline">
          ← Back to list
        </Link>
      </header>

      <LocaleTabs locale={locale} baseHref={`/admin/destinations/${slug}`} />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <DestinationForm initial={initial} />
      </div>
    </div>
  );
}

function safeJoin(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.join('\n') : '';
  } catch {
    return '';
  }
}