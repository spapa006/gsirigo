'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Manual data-retention action: aggregates raw click events older than
 * 12 months into monthly rollups and prunes them, then refreshes the page.
 */
export function PruneClicksButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function prune() {
    if (
      !window.confirm(
        'Aggregate raw click events older than 12 months into monthly rollups and delete them?'
      )
    ) {
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch('/api/cron/prune-clicks', { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        rolledUp?: number;
        pruned?: number;
      };
      if (!res.ok) {
        setNotice(data.error ?? `Prune failed (${res.status})`);
        return;
      }
      setNotice(
        `Archived ${data.rolledUp ?? 0} month-row${(data.rolledUp ?? 0) === 1 ? '' : 's'}, pruned ${data.pruned ?? 0} raw event${(data.pruned ?? 0) === 1 ? '' : 's'}.`
      );
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Prune failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {notice && <p className="max-w-xs text-xs text-slate-600">{notice}</p>}
      <Button variant="outline" size="sm" onClick={prune} disabled={busy}>
        <Trash2 />
        {busy ? 'Pruning…' : 'Prune old events'}
      </Button>
    </div>
  );
}