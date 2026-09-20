import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, MapPin } from 'lucide-react';
import { listAllDestinationRows } from '@/lib/db/repositories/destinations';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Destinations' };

type Props = {
  searchParams: Promise<{ locale?: string }>;
};

export default async function AdminDestinationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const localeFilter = params.locale ?? 'all';
  const rows = await listAllDestinationRows();
  const filtered = rows.filter(
    (r) => localeFilter === 'all' || r.locale === localeFilter
  );

  // Group by slug for a readable table.
  const bySlug = new Map<string, typeof rows>();
  for (const row of filtered) {
    if (!bySlug.has(row.slug)) bySlug.set(row.slug, []);
    bySlug.get(row.slug)!.push(row);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Destinations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Localized destination cards + pre-filled widget city per locale.
          </p>
        </div>
        <Link href="/admin/destinations/new" className={buttonVariants()}>
          <Plus />
          New destination
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Locale</span>
        {['all', 'en', 'fr', 'es', 'ar'].map((l) => (
          <Link
            key={l}
            href={l === 'all' ? '/admin/destinations' : `/admin/destinations?locale=${l}`}
            className={
              localeFilter === l
                ? 'rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white'
                : 'rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'
            }
          >
            {l === 'all' ? 'All' : l.toUpperCase()}
          </Link>
        ))}
      </div>

      {bySlug.size === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            No destination rows yet — run{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">npm run db:seed</code>{' '}
            or create one.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Locales</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[...bySlug.entries()].map(([slug, localeRows]) => (
                <tr key={slug} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-teal-800">{slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {localeRows.map((row) => (
                        <Link
                          key={row.locale}
                          href={`/admin/destinations/${slug}?locale=${row.locale}`}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600 hover:bg-teal-100 hover:text-teal-800"
                        >
                          {row.locale}
                        </Link>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{localeRows[0]?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{localeRows[0]?.weight}</td>
                  <td className="px-4 py-3">
                    <Badge variant={localeRows.every((r) => r.active) ? 'default' : 'outline'}>
                      {localeRows.every((r) => r.active) ? 'Active' : 'Partial'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/destinations/${slug}?locale=${localeRows[0]?.locale ?? 'en'}`}
                      className="text-xs font-semibold text-teal-700 hover:underline"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}