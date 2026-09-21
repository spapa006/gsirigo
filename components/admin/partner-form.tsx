'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Trash2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type PartnerFormValues = {
  id: string;
  locale: string;
  name: string;
  shortName: string;
  tagline: string;
  baseUrl: string;
  color: string;
  commissionNote: string;
  embed: string;
  active: boolean;
  marker: string;
  subId: string;
};

export function PartnerForm({
  initial,
  embedHelp,
}: {
  initial?: PartnerFormValues | null;
  embedHelp: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PartnerFormValues>(
    initial ?? {
      id: 'rentalcars',
      locale: 'en',
      name: '',
      shortName: '',
      tagline: '',
      baseUrl: '',
      color: '#1d4ed8',
      commissionNote: '',
      embed: '',
      active: true,
      marker: '',
      subId: '',
    }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function set<K extends keyof PartnerFormValues>(
    key: K,
    value: PartnerFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Failed to save partner. Server responded ${res.status}.`);
        return;
      }
      setNotice('Saved. Public widgets revalidated.');
      router.refresh();
    } catch {
      setError('Failed to save partner. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!values.id || !values.locale) return;
    if (!window.confirm(`Delete "${values.id}" (${values.locale})? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/partners?id=${encodeURIComponent(values.id)}&locale=${values.locale}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error();
      router.push('/admin/partners');
      router.refresh();
    } catch {
      setError('Failed to delete partner.');
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

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Partner id</span>
          <select
            value={values.id}
            disabled={!!initial}
            onChange={(e) => set('id', e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="rentalcars">rentalcars</option>
            <option value="autoeurope">autoeurope</option>
            <option value="economybookings">economybookings</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Active</span>
          <label className="flex h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.active}
              onChange={(e) => set('active', e.target.checked)}
              className="h-4 w-4 rounded accent-teal-700"
            />
            Widgets render this partner
          </label>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Brand color</span>
          <Input type="color" value={values.color} onChange={(e) => set('color', e.target.value)} className="h-10 p-1" />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Display name</span>
          <Input value={values.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Short name (trust bar)</span>
          <Input value={values.shortName} onChange={(e) => set('shortName', e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Base URL</span>
          <Input value={values.baseUrl} onChange={(e) => set('baseUrl', e.target.value)} />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Tagline</span>
          <Input value={values.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Commission note</span>
          <Input value={values.commissionNote} onChange={(e) => set('commissionNote', e.target.value)} />
        </label>

        <label className="block sm:col-span-3">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Travelpayouts embed snippet (this locale)
          </span>
          <textarea
            value={values.embed}
            onChange={(e) => set('embed', e.target.value)}
            rows={7}
            placeholder={embedHelp}
            className="w-full rounded-md border border-input bg-slate-50 px-3 py-2 font-mono text-xs leading-relaxed"
          />
          <span className="mt-1 block text-[11px] text-slate-400">
            Paste the widget HTML from your Travelpayouts dashboard. When set, the
            public CarRentalWidget renders this snippet verbatim.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Marker override</span>
          <Input value={values.marker} onChange={(e) => set('marker', e.target.value)} placeholder="(use site default)" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Sub ID override</span>
          <Input value={values.subId} onChange={(e) => set('subId', e.target.value)} placeholder="(use site default)" />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save />
          Save partner
        </Button>
        {initial && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={busy}>
            <Trash2 />
            Delete this locale row
          </Button>
        )}
      </div>
    </div>
  );
}