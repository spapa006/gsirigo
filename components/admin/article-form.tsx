'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Trash2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type ArticleFormValues = {
  slug: string;
  locale: string;
  status: 'draft' | 'published';
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  image: string;
  date: string;
  readingTime: string;
  destination: string;
  widgetPartner: string;
  widgetCity: string;
  widgetCountry: string;
  body: string;
};

export const EMPTY_ARTICLE: ArticleFormValues = {
  slug: '',
  locale: 'en',
  status: 'published',
  title: '',
  excerpt: '',
  metaTitle: '',
  metaDescription: '',
  image: '',
  date: '',
  readingTime: '',
  destination: '',
  widgetPartner: '',
  widgetCity: '',
  widgetCountry: '',
  body: '',
};

export function ArticleForm({
  initial,
  destinationSlugs,
  onDelete,
}: {
  /** Article to edit, or null for a new article. */
  initial?: ArticleFormValues | null;
  destinationSlugs: string[];
  /** Called after a successful save (nullable slug = server assigned). */
  onDelete?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ArticleFormValues>(
    initial ?? EMPTY_ARTICLE
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function set<K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to save article.');
        return;
      }
      if (values.slug) {
        router.push(`/admin/articles/${values.slug}?locale=${values.locale}`);
        router.refresh();
        return;
      }
      setNotice('Saved. Revalidating public pages…');
      router.refresh();
    } catch {
      setError('Failed to save article. Check your connection.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!values.slug) return;
    if (!window.confirm(`Delete "${values.slug}" (${values.locale})? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/articles?slug=${encodeURIComponent(values.slug)}&locale=${values.locale}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error();
      onDelete?.();
      router.push('/admin/articles');
      router.refresh();
    } catch {
      setError('Failed to delete article.');
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
        <p className="rounded-md bg-teal-50 px-3 py-2 text-xs font-medium text-teal-800">
          {notice}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug (URL)" hint="lowercase, dashes — e.g. dubai-airport-car-rental">
          <Input
            value={values.slug}
            onChange={(e) => set('slug', e.target.value)}
            disabled={!!initial}
            placeholder="dubai-airport-car-rental"
          />
        </Field>
        <Field label="Status">
          <select
            value={values.status}
            onChange={(e) => set('status', e.target.value as 'draft' | 'published')}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Title" required>
            <Input value={values.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Excerpt (card summary)">
            <textarea
              value={values.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <Field label="Meta title (SEO)">
          <Input value={values.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} />
        </Field>
        <Field label="Meta description (SEO)">
          <Input value={values.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} />
        </Field>

        <Field label="Image URL" hint="Picsum placeholder by default">
          <Input value={values.image} onChange={(e) => set('image', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <Input type="date" value={values.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Reading time" hint="e.g. 6 min read">
            <Input value={values.readingTime} onChange={(e) => set('readingTime', e.target.value)} />
          </Field>
        </div>

        <Field label="Related destination">
          <Input
            list="destination-slugs"
            value={values.destination}
            onChange={(e) => set('destination', e.target.value)}
            placeholder="italy"
          />
          <datalist id="destination-slugs">
            {destinationSlugs.map((slug) => (
              <option key={slug} value={slug} />
            ))}
          </datalist>
        </Field>

        <Field label="Widget partner" hint="rentalcars | autoeurope | economybookings">
          <Input value={values.widgetPartner} onChange={(e) => set('widgetPartner', e.target.value)} placeholder="rentalcars" />
        </Field>
        <Field label="Widget city" hint="pre-filled pickup city">
          <Input value={values.widgetCity} onChange={(e) => set('widgetCity', e.target.value)} />
        </Field>
        <Field label="Widget country">
          <Input value={values.widgetCountry} onChange={(e) => set('widgetCountry', e.target.value)} />
        </Field>
      </div>

      <Field
        label="Body (MDX)"
        hint={
          <span>
            Full Markdown + embedded widgets: <code>{'<Widget partner="rentalcars" city="Rome" country="Italy"/>'}</code>
          </span>
        }
      >
        <textarea
          value={values.body}
          onChange={(e) => set('body', e.target.value)}
          rows={18}
          className="w-full rounded-md border border-input bg-slate-50 px-3 py-2 font-mono text-xs leading-relaxed"
          placeholder={'# Title\n\nIntro paragraph…\n\n<Widget partner="rentalcars" city="Rome" country="Italy"/>\n\nMore content…'}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save />
          Save & publish changes
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

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}