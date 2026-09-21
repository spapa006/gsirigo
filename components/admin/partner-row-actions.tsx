'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';

/**
 * Per-locale-row actions on the partners list page: explicit Edit link and a
 * confirmed Delete (falls back to the built-in static partner config on the
 * public site, so removing a row is always safe).
 */
export function PartnerRowActions({
  id,
  locale,
  name,
}: {
  id: string;
  locale: string;
  name: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(`Delete "${name || id}" (${locale})? Public widgets fall back to the built-in config for this locale.`)) {
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/partners?id=${encodeURIComponent(id)}&locale=${encodeURIComponent(locale)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      window.alert('Failed to delete partner. Try again.');
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <Link
        href={`/admin/partners/${id}?locale=${locale}`}
        title={`Edit ${id} (${locale})`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-700"
        aria-label={`Edit ${id} (${locale})`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        title={`Delete ${id} (${locale})`}
        aria-label={`Delete ${id} (${locale})`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}