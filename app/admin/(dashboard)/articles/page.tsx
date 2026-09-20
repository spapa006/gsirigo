import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import { listAllArticleRows } from '@/lib/db/repositories/articles';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Articles' };

type Props = {
  searchParams: Promise<{ locale?: string; status?: string }>;
};

const LOCALE_FILTERS = ['all', 'en', 'fr', 'es', 'ar'] as const;

export default async function AdminArticlesPage({ searchParams }: Props) {
  const params = await searchParams;
  const localeFilter = params.locale ?? 'all';
  const statusFilter = params.status ?? 'all';

  const rows = await listAllArticleRows();
  const filtered = rows.filter((r) => {
    const matchesLocale = localeFilter === 'all' || r.locale === localeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesLocale && matchesStatus;
  });

  const linkFor = (key: 'locale' | 'status', value: string) => {
    const url = new URLSearchParams();
    if (key === 'locale') {
      if (value !== 'all') url.set('locale', value);
      if (statusFilter !== 'all') url.set('status', statusFilter);
    } else {
      if (localeFilter !== 'all') url.set('locale', localeFilter);
      if (value !== 'all') url.set('status', value);
    }
    return `/admin/articles${url.toString() ? `?${url.toString()}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Articles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One row per locale — create or edit each localized version.
          </p>
        </div>
        <Link href="/admin/articles/new" className={buttonVariants()}>
          <Plus />
          New article
        </Link>
      </header>

      <div className="flex flex-wrap gap-4">
        <FilterGroup
          label="Locale"
          options={LOCALE_FILTERS.map((l) => ({ value: l, label: l === 'all' ? 'All' : l.toUpperCase() }))}
          active={localeFilter}
          buildHref={(v) => linkFor('locale', v)}
        />
        <FilterGroup
          label="Status"
          options={[
            { value: 'all', label: 'All' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ]}
          active={statusFilter}
          buildHref={(v) => linkFor('status', v)}
        />
        <p className="ml-auto text-xs text-muted-foreground">
          {filtered.length} row{filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            No article rows match this filter.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Run <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">npm run db:seed</code>{' '}
            once to import the MDX catalogue, or create a new article.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Locale</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((row) => (
                <tr key={`${row.slug}-${row.locale}`} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-teal-800">
                    <Link href={`/admin/articles/${row.slug}?locale=${row.locale}`} className="hover:underline">
                      {row.slug}
                    </Link>
                  </td>
                  <td className="px-4 py-3 uppercase">{row.locale}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.status === 'published' ? 'default' : 'outline'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3">{row.title || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.date || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/articles/${row.slug}?locale=${row.locale}`}
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

function FilterGroup({
  label,
  options,
  active,
  buildHref,
}: {
  label: string;
  options: { value: string; label: string }[];
  active: string;
  buildHref: (value: string) => string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="flex overflow-hidden rounded-md border">
        {options.map((opt) => (
          <Link
            key={opt.value}
            href={buildHref(opt.value)}
            className={
              opt.value === active
                ? 'bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white'
                : 'bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50'
            }
          >
            {opt.label}
          </Link>
        ))}
      </div>
    </div>
  );
}