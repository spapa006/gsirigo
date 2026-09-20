import type { Metadata } from 'next';
import { PartnerForm } from '@/components/admin/partner-form';
import { LocaleTabs } from '@/components/admin/locale-tabs';

export const metadata: Metadata = { title: 'New partner row' };

type Props = { searchParams: Promise<{ locale?: string }> };

export default async function NewPartnerPage({ searchParams }: Props) {
  const params = await searchParams;
  const locale = params.locale ?? 'en';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">New partner row</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a Travelpayouts partner for one locale (repeat per locale).
        </p>
      </header>

      <LocaleTabs locale={locale} baseHref="/admin/partners/new" />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <PartnerForm
          initial={null}
          embedHelp="Paste the Travelpayouts widget snippet here (HTML)."
        />
      </div>
    </div>
  );
}