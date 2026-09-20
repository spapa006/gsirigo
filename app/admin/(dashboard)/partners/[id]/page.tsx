import type { Metadata } from 'next';
import Link from 'next/link';
import { getPartnerRow } from '@/lib/db/repositories/partners';
import { PartnerForm } from '@/components/admin/partner-form';
import { LocaleTabs } from '@/components/admin/locale-tabs';
import { EMBED_PLACEHOLDER } from '../embed-help';

export const metadata: Metadata = { title: 'Edit partner' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string }>;
};

export default async function EditPartnerPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const locale = sp.locale ?? 'en';

  const row = await getPartnerRow(id, locale);
  const initial = row
    ? {
        id: row.id,
        locale: row.locale,
        name: row.name,
        shortName: row.shortName,
        tagline: row.tagline,
        baseUrl: row.baseUrl,
        color: row.color,
        commissionNote: row.commissionNote,
        embed: row.embed,
        active: row.active,
        marker: row.marker ?? '',
        subId: row.subId ?? '',
      }
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Edit partner — {id}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {initial
              ? `Updating the "${locale}" row.`
              : `No "${locale}" row yet — save to create it.`}
          </p>
        </div>
        <Link href="/admin/partners" className="text-sm font-medium text-teal-700 hover:underline">
          ← Back to partners
        </Link>
      </header>

      <LocaleTabs locale={locale} baseHref={`/admin/partners/${id}`} />

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <PartnerForm initial={initial} embedHelp={EMBED_PLACEHOLDER} />
      </div>
    </div>
  );
}