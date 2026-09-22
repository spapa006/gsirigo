import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, ArrowLeftRight } from 'lucide-react';
import { listRedirectLinks } from '@/lib/db/repositories/redirects';
import { getSettings } from '@/lib/db/repositories/settings';
import { siteUrl } from '@/lib/site';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Redirects' };

export default async function AdminRedirectsPage() {
  const links = await listRedirectLinks();
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Redirect links</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cloaked affiliate links (<code className="font-mono">/go/slug</code>) with
            click tracking. Swap the destination URL later without touching content.
          </p>
        </div>
        <Link href="/admin/redirects/new" className={buttonVariants()}>
          <Plus />
          New redirect
        </Link>
      </header>

      {links.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <ArrowLeftRight className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">No redirect links yet.</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            Create one to turn a long Travelpayouts affiliate URL into a clean
            <code className="font-mono"> {siteUrl(settings.siteUrl)}/go/dubai-rentalcars</code>{' '}
            style link.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3 text-center">Clicks</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {links.map((link) => (
                <tr key={link.slug} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <code className="font-mono text-xs text-teal-800">/go/{link.slug}</code>
                    {link.label && (
                      <span className="mt-0.5 block text-[11px] text-slate-400">{link.label}</span>
                    )}
                  </td>
                  <td className="max-w-[300px] truncate px-4 py-3 text-xs text-slate-500">
                    <a href={link.destinationUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {link.destinationUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3">{link.partner || '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold">{link.clickCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={link.isActive ? 'default' : 'outline'}>
                      {link.isActive ? 'Active' : 'Off'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/redirects/${link.slug}/analytics`}
                        className="text-xs font-semibold text-slate-500 hover:text-teal-700 hover:underline"
                      >
                        Analytics →
                      </Link>
                      <Link
                        href={`/admin/redirects/${link.slug}`}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        Edit →
                      </Link>
                    </div>
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