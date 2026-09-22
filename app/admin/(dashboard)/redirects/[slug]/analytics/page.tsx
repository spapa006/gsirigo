import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BarChart3,
  MousePointerClick,
  Bot,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';
import { getRedirectLink, getRedirectAnalytics } from '@/lib/db/repositories/redirects';
import type {
  AnalyticsBucket,
  AnalyticsSeriesPoint,
  RecentClickRow,
} from '@/lib/db/repositories/redirects';
import { ClickChart } from '@/components/admin/click-chart';
import { StatCard } from '@/components/admin/stat-card';
import { PruneClicksButton } from '@/components/admin/prune-clicks-button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Redirect analytics' };

const RANGE_OPTIONS = [7, 30, 90, 365] as const;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ days?: string; bots?: string }>;
};

/** Fill gaps in the daily series so the chart spans the full range. */
function fillSeries(points: AnalyticsSeriesPoint[], days: number): AnalyticsSeriesPoint[] {
  const byDay = new Map(points.map((p) => [p.day, p.count]));
  const out: AnalyticsSeriesPoint[] = [];
  const start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  const startDay = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  for (let i = 0; i < days; i++) {
    const d = new Date(startDay + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return out;
}

function parseDays(raw: string | undefined): number {
  const n = Number(raw);
  return RANGE_OPTIONS.includes(n as (typeof RANGE_OPTIONS)[number]) ? n : 30;
}

function BucketTable({ title, buckets }: { title: string; buckets: AnalyticsBucket[] }) {
  if (buckets.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="mt-3 text-center text-xs text-muted-foreground">No data yet.</p>
      </div>
    );
  }
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {buckets.map((b) => {
          const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
          return (
            <li key={b.label} className="text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-slate-600" title={b.label}>
                  {b.label}
                </span>
                <span className="shrink-0 font-semibold text-slate-900">
                  {b.count}
                  <span className="ml-1.5 font-normal text-slate-400">{pct}%</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function fmtDate(d: Date): string {
  return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function RecentTable({ rows }: { rows: RecentClickRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground">
        No events in this range yet.
      </p>
    );
  }
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b text-slate-400">
            <th className="py-2 pr-3 font-semibold">Time (UTC)</th>
            <th className="py-2 pr-3 font-semibold">Country</th>
            <th className="py-2 pr-3 font-semibold">Device</th>
            <th className="py-2 pr-3 font-semibold">Browser / OS</th>
            <th className="py-2 pr-3 font-semibold">Referrer</th>
            <th className="py-2 pr-3 font-semibold">Locale</th>
            <th className="py-2 font-semibold">Bot</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap py-2 pr-3 text-slate-500">
                {fmtDate(r.clickedAt)}
              </td>
              <td className="py-2 pr-3">
                {r.country ? (
                  <span className="font-medium">{r.country}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="py-2 pr-3 capitalize text-slate-600">
                {r.deviceType ?? '—'}
              </td>
              <td className="py-2 pr-3 text-slate-600">
                {r.browser ? `${r.browser}${r.os ? ` · ${r.os}` : ''}` : '—'}
              </td>
              <td className="max-w-[200px] truncate py-2 pr-3 text-slate-500" title={r.referrer ?? ''}>
                {r.referrer ?? 'direct'}
              </td>
              <td className="py-2 pr-3">{r.locale ?? '—'}</td>
              <td className="py-2">
                {r.isBot ? (
                  <Badge variant="destructive">bot</Badge>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function RedirectAnalyticsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { days: rawDays, bots: rawBots } = await searchParams;
  const days = parseDays(rawDays);
  const includeBots = rawBots === '1';

  const [link, analytics] = await Promise.all([
    getRedirectLink(slug),
    getRedirectAnalytics(slug, days, includeBots),
  ]);
  if (!link) notFound();

  const series = fillSeries(analytics.series, days);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Analytics</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">/go/{slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/redirects/${slug}`}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            ← Edit redirect
          </Link>
          <Link
            href="/admin/redirects"
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            ← Back to redirects
          </Link>
        </div>
      </header>

      {/* Range + bot toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border bg-white p-1 shadow-sm">
          {RANGE_OPTIONS.map((d) => (
            <Link
              key={d}
              href={`/admin/redirects/${slug}/analytics?days=${d}${includeBots ? '&bots=1' : ''}`}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === d ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {d}d
            </Link>
          ))}
        </div>
        <Link
          href={`/admin/redirects/${slug}/analytics?days=${days}${includeBots ? '' : '&bots=1'}`}
          className={`inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold shadow-sm transition-colors ${
            includeBots ? 'border-teal-600 text-teal-800' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bot className="h-4 w-4" />
          {includeBots ? 'Including bots' : 'Bots excluded'}
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total clicks"
          value={includeBots ? analytics.totalHuman + analytics.totalBots : analytics.totalHuman}
          hint="all-time, bots excluded by default"
        />
        <StatCard
          label="Last 7 days"
          value={analytics.last7}
          hint="human clicks"
        />
        <StatCard
          label="Last 30 days"
          value={analytics.last30}
          hint="human clicks"
        />
        <StatCard
          label="Bot clicks"
          value={analytics.totalBots}
          hint={`${analytics.totalBots === 0 ? 'no bot traffic' : 'excluded from headline stats'}`}
        />
      </div>

      {/* Time-series chart */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-teal-700" />
          <h2 className="text-base font-bold">Clicks per day</h2>
        </div>
        <div className="mt-4">
          <ClickChart data={series} />
        </div>
      </section>

      {/* Breakdown tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BucketTable title="By country" buckets={analytics.byCountry} />
        <BucketTable title="By device" buckets={analytics.byDevice} />
        <BucketTable title="By referrer" buckets={analytics.byReferrer} />
        <BucketTable title="By locale" buckets={analytics.byLocale} />
      </div>

      {/* Recent raw events */}
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-4 w-4 text-teal-700" />
          <h2 className="text-base font-bold">Recent events</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            last 50, {includeBots ? 'including' : 'excluding'} bots
          </span>
        </div>
        <RecentTable rows={analytics.recent} />
      </section>

      {/* Retention */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed bg-white p-5">
        <div className="flex items-start gap-3">
          <CalendarRange className="mt-0.5 h-4 w-4 text-slate-400" />
          <div>
            <h2 className="text-sm font-bold">Data retention</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Raw click events older than 12 months are aggregated into monthly rollups and
              pruned automatically (1st of each month). You can run it manually too.
            </p>
          </div>
        </div>
        <PruneClicksButton />
      </section>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <CalendarDays className="h-3.5 w-3.5" />
        Day buckets are UTC. Bot/crawler traffic is stored but hidden from headline stats by
        default — enable the toggle to inspect it.
      </p>
    </div>
  );
}