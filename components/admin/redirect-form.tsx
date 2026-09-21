'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Trash2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type RedirectFormValues = {
  slug: string;
  destinationUrl: string;
  partner: string;
  label: string;
  isActive: boolean;
};

export function RedirectForm({
  initial,
  partnerOptions,
  siteUrl,
}: {
  initial?: RedirectFormValues | null;
  partnerOptions: string[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<RedirectFormValues>(
    initial ?? {
      slug: '',
      destinationUrl: '',
      partner: '',
      label: '',
      isActive: true,
    }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function set<K extends keyof RedirectFormValues>(
    key: K,
    value: RedirectFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Failed to save redirect. Server responded ${res.status}.`);
        return;
      }
      if (values.slug) {
        router.push('/admin/redirects');
        router.refresh();
        return;
      }
      setNotice('Saved.');
      router.refresh();
    } catch {
      setError('Failed to save redirect. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!values.slug) return;
    if (!window.confirm(`Delete /go/${values.slug}? Click history is removed too.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/redirects/${encodeURIComponent(values.slug)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      router.push('/admin/redirects');
      router.refresh();
    } catch {
      setError('Failed to delete redirect.');
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Slug (public URL: <code className="font-mono">{siteUrl}/go/…</code>)
          </span>
          <Input
            value={values.slug}
            onChange={(e) => set('slug', e.target.value)}
            disabled={!!initial}
            placeholder="dubai-rentalcars"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Active</span>
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="h-4 w-4 rounded accent-teal-700"
            />
            Redirects are enabled
          </label>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Destination URL *</span>
          <Input
            value={values.destinationUrl}
            onChange={(e) => set('destinationUrl', e.target.value)}
            placeholder="https://www.rentalcars.com/…?aff=YOUR_MARKER&sub_id=dubai-rentalcars"
          />
          <span className="mt-1 block text-[11px] text-slate-400">
            Paste the full Travelpayouts affiliate URL (with marker and sub_id if
            you keep them in the URL). Only http(s) URLs are accepted.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Partner</span>
          <select
            value={values.partner}
            onChange={(e) => set('partner', e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">(none)</option>
            {partnerOptions.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Label (internal note)</span>
          <Input value={values.label} onChange={(e) => set('label', e.target.value)} placeholder="Dubai guide hero CTA" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save />
          Save redirect
        </Button>
        {initial && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={busy}>
            <Trash2 />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}