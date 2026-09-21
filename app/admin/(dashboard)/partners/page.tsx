import type { Metadata } from 'next';
import Link from 'next/link';
import { Handshake, Plus } from 'lucide-react';
import { listAllPartnerRows } from '@/lib/db/repositories/partners';
import { PartnerRowActions } from '@/components/admin/partner-row-actions';
import { widgetEmbedHelp } from './embed-help';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Partners' };

export default async function AdminPartnersPage() {
  const rows = await listAllPartnerRows();

  const byId = new Map<string, (typeof rows)[number][]>();
  // Ensure every partner id is present even without rows.
  for (const id of ['rentalcars', 'autoeurope', 'economybookings']) {
    byId.set(id, []);
  }
  for (const row of rows) {
    if (!byId.has(row.id)) byId.set(row.id, []);
    byId.get(row.id)!.push(row);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Partners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Travelpayouts widget embeds per partner + locale, activation and
          attribution overrides.
        </p>
      </header>

      {[...byId.entries()].map(([id, localeRows]) => {
        const first = localeRows[0];
        return (
          <section key={id} className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: first?.color ?? '#1d4ed8' }}
                >
                  <Handshake className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold">{first?.name ?? id}</h2>
                  <p className="text-xs text-muted-foreground">
                    {first?.tagline} · {first?.commissionNote}
                  </p>
                </div>
              </div>
              <Badge variant={first?.active === false ? 'outline' : 'default'}>
                {first?.active === false ? 'Inactive' : 'Active'}
              </Badge>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {['en', 'fr', 'es', 'ar'].map((locale) => {
                const row = localeRows.find((r) => r.locale === locale);
                return (
                  <span
                    key={locale}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 py-1 pl-1 pr-1.5"
                  >
                    {row ? (
                      <>
                        <span className="px-1.5 text-xs font-semibold uppercase text-slate-600">
                          {locale}{row.embed ? ' ✓' : ''}
                        </span>
                        <PartnerRowActions id={id} locale={locale} name={row.name} />
                      </>
                    ) : (
                      <Link
                        href={`/admin/partners/${id}?locale=${locale}`}
                        title="No row for this locale — create one"
                        className="rounded-md border border-dashed px-2 py-1 text-xs font-semibold uppercase text-slate-400 hover:border-teal-300 hover:text-teal-700"
                      >
                        {locale} +
                      </Link>
                    )}
                  </span>
                );
              })}
            </div>

            {!first?.embed && localeRows.every((r) => !r.embed) && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Paste the real Travelpayouts embed from your dashboard — until
                then the public widget renders the built-in mock form. See{' '}
                <code className="font-mono">{widgetEmbedHelp(id)}</code>.
              </p>
            )}
          </section>
        );
      })}

      <Link href="/admin/partners/new" className={buttonVariants({ variant: 'outline' })}>
        <Plus />
        Add a partner row for a new locale
      </Link>
    </div>
  );
}