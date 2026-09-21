'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type SettingsField = {
  key: string;
  label: string;
  hint?: string;
  textarea?: boolean;
};

const FIELDS: SettingsField[] = [
  { key: 'site_url', label: 'Site URL (canonical)', hint: 'Used in sitemap.xml, robots.txt and hreflang.' },
  { key: 'ga_id', label: 'Google Analytics 4 ID', hint: 'e.g. G-XXXXXXX. Analytics loads when set.' },
  { key: 'default_marker', label: 'Default Travelpayouts marker', hint: 'Attribution param appended to affiliate links.' },
  { key: 'default_sub_id', label: 'Default Travelpayouts sub_id', hint: 'Optional sub-campaign id.' },
  {
    key: 'affiliate_disclosure',
    label: 'Affiliate disclosure text',
    hint: 'Shown in the footer instead of the default i18n string.',
    textarea: true,
  },
  { key: 'social_x', label: 'X / Twitter URL' },
  { key: 'social_instagram', label: 'Instagram URL' },
  { key: 'social_facebook', label: 'Facebook URL' },
];

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to save settings.');
        return;
      }
      setNotice('Settings saved. Public pages revalidated.');
      router.refresh();
    } catch {
      setError('Failed to save settings.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-md bg-teal-50 px-3 py-2 text-xs font-medium text-teal-800">{notice}</p>
      )}

      <div className="space-y-4">
        {FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              {field.label}
              <code className="ml-2 rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] text-slate-500">
                {field.key}
              </code>
            </span>
            {field.textarea ? (
              <textarea
                value={values[field.key] ?? ''}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [field.key]: e.target.value }))
                }
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            ) : (
              <Input
                value={values[field.key] ?? ''}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [field.key]: e.target.value }))
                }
              />
            )}
            {field.hint && (
              <span className="mt-1 block text-[11px] text-slate-400">{field.hint}</span>
            )}
          </label>
        ))}
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        Values saved in the database override build-time environment variables.
        For server-side secrets (<code className="font-mono">AUTH_SECRET</code>,{' '}
        <code className="font-mono">ADMIN_PASSWORD_HASH</code>,{' '}
        <code className="font-mono">TURSO_DATABASE_URL</code> /{' '}
        <code className="font-mono">TURSO_AUTH_TOKEN</code>) keep using the
        Vercel env var panel — never store secrets in these site settings.
      </div>

      <Button type="button" onClick={handleSave} disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        <Save />
        Save settings
      </Button>
    </div>
  );
}