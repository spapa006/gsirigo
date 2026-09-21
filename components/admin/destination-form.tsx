'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Trash2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type DestinationFormValues = {
  slug: string;
  locale: string;
  name: string;
  country: string;
  city: string;
  tagline: string;
  description: string;
  highlights: string;
  priceFrom: string;
  image: string;
  weight: number;
  active: boolean;
};

export function DestinationForm({
  initial,
}: {
  initial?: DestinationFormValues | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<DestinationFormValues>(
    initial ?? {
      slug: '',
      locale: 'en',
      name: '',
      country: '',
      city: '',
      tagline: '',
      description: '',
      highlights: '',
      priceFrom: '',
      image: '',
      weight: 99,
      active: true,
    }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function set<K extends keyof DestinationFormValues>(
    key: K,
    value: DestinationFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const highlights = values.highlights
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean);
      const res = await fetch('/api/admin/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, highlights }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `Failed to save destination. Server responded ${res.status}.`);
        return;
      }
      if (values.slug) {
        router.push(`/admin/destinations/${values.slug}?locale=${values.locale}`);
        router.refresh();
        return;
      }
      setNotice('Saved. Revalidating public pages…');
      router.refresh();
    } catch {
      setError('Failed to save destination. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!values.slug) return;
    if (!window.confirm(`Delete "${values.slug}" (${values.locale})?`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/destinations?slug=${encodeURIComponent(values.slug)}&locale=${values.locale}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error();
      router.push('/admin/destinations');
      router.refresh();
    } catch {
      setError('Failed to delete destination.');
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
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Slug (URL) *</span>
          <Input value={values.slug} onChange={(e) => set('slug', e.target.value)} disabled={!!initial} placeholder="italy" />
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
            Visible on the public site
          </label>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Name *</span>
          <Input value={values.name} onChange={(e) => set('name', e.target.value)} placeholder="Italy" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Country</span>
          <Input value={values.country} onChange={(e) => set('country', e.target.value)} placeholder="Italy" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Pickup city (widget prefill)</span>
          <Input value={values.city} onChange={(e) => set('city', e.target.value)} placeholder="Rome Fiumicino Airport" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Tagline</span>
          <Input value={values.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Price from (localized phrase)</span>
          <Input value={values.priceFrom} onChange={(e) => set('priceFrom', e.target.value)} placeholder="from $110/week" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Image URL</span>
          <Input value={values.image} onChange={(e) => set('image', e.target.value)} placeholder="https://images.unsplash.com/photo-…" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Sort weight (low = first)</span>
          <Input type="number" value={values.weight} onChange={(e) => set('weight', Number(e.target.value))} />
        </label>

        <div className="sm:col-span-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Description</span>
            <textarea
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Highlights (one per line)
            </span>
            <textarea
              value={values.highlights}
              onChange={(e) => set('highlights', e.target.value)}
              rows={4}
              placeholder={'Scenic Amalfi coastline\nZTL zones to learn about\nGreat value in shoulder season'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save />
          Save destination
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