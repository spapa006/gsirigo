import type { Metadata } from 'next';
import { getSettings } from '@/lib/db/repositories/settings';
import { SettingsForm } from '@/components/admin/settings-form';

export const metadata: Metadata = { title: 'Settings' };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Site settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Site-wide configuration that the public site reads live (GA, marker,
          disclosure, social links).
        </p>
      </header>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <SettingsForm
          initial={{
            site_url: settings.siteUrl,
            ga_id: settings.gaId,
            default_marker: settings.defaultMarker,
            default_sub_id: settings.defaultSubId,
            affiliate_disclosure: settings.affiliateDisclosure,
            social_x: settings.socialX,
            social_instagram: settings.socialInstagram,
            social_facebook: settings.socialFacebook,
          }}
        />
      </div>
    </div>
  );
}