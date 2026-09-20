import type { Metadata } from 'next';
import { PARTNER_IDS } from '@/lib/db/repositories/partners';
import { getSettings } from '@/lib/db/repositories/settings';
import { RedirectForm } from '@/components/admin/redirect-form';

export const metadata: Metadata = { title: 'New redirect' };

export default async function NewRedirectPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">New redirect link</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Turn an affiliate URL into a clean, trackable <code className="font-mono">/go/slug</code> link.
        </p>
      </header>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <RedirectForm
          initial={null}
          partnerOptions={PARTNER_IDS}
          siteUrl={settings.siteUrl}
        />
      </div>
    </div>
  );
}