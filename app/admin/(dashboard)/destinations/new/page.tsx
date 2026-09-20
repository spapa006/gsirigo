import type { Metadata } from 'next';
import { DestinationForm } from '@/components/admin/destination-form';
import { LocaleTabs } from '@/components/admin/locale-tabs';

export const metadata: Metadata = { title: 'New destination' };

type Props = { searchParams: Promise<{ locale?: string }> };

export default async function NewDestinationPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = params.locale ?? 'en';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">New destination</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create one row per locale with the same slug.
        </p>
      </header>

      <LocaleTabs locale={locale} baseHref="/admin/destinations/new" />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <DestinationForm initial={null} />
      </div>
    </div>
  );
}