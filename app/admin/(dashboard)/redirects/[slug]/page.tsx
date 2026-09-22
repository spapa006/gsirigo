import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PARTNER_IDS } from '@/lib/db/repositories/partners';
import { getRedirectLink } from '@/lib/db/repositories/redirects';
import { getSettings } from '@/lib/db/repositories/settings';
import { RedirectForm } from '@/components/admin/redirect-form';

export const metadata: Metadata = { title: 'Edit redirect' };

type Props = { params: Promise<{ slug: string }> };

export default async function EditRedirectPage({ params }: Props) {
  const { slug } = await params;
  const [link, settings] = await Promise.all([getRedirectLink(slug), getSettings()]);
  if (!link) notFound();

  const initial = {
    slug: link.slug,
    destinationUrl: link.destinationUrl,
    partner: link.partner ?? '',
    label: link.label,
    isActive: link.isActive,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Edit redirect</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            /go/{slug} — {link.clickCount} click{link.clickCount === 1 ? '' : 's'} tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/redirects/${slug}/analytics`}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            View analytics →
          </Link>
          <Link href="/admin/redirects" className="text-sm font-medium text-teal-700 hover:underline">
            ← Back to redirects
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <RedirectForm
          initial={initial}
          partnerOptions={PARTNER_IDS}
          siteUrl={settings.siteUrl}
        />
      </div>
    </div>
  );
}