import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { countArticles } from '@/lib/db/repositories/articles';
import { countDestinationSlugs } from '@/lib/db/repositories/destinations';
import { countPartners } from '@/lib/db/repositories/partners';
import {
  countRedirectLinks,
  getClicksSince,
  getRecentClicks,
} from '@/lib/db/repositories/redirects';
import { StatCard } from '@/components/admin/stat-card';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function AdminDashboardPage() {
  const [articleCount, destinationCount, partnerCount, linkCount, clicks30d, recent] =
    await Promise.all([
      countArticles(),
      countDestinationSlugs(),
      countPartners(),
      countRedirectLinks(),
      getClicksSince(30),
      getRecentClicks(10),
    ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of the Gsirigo content and redirect infrastructure.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Articles" value={articleCount} hint="across 4 locales" />
        <StatCard label="Destinations" value={destinationCount} hint="across 4 locales" />
        <StatCard label="Partners" value={partnerCount} hint="across 4 locales" />
        <StatCard label="Redirect links" value={linkCount} hint="/go/… cloaked URLs" />
        <StatCard label="Clicks (30 days)" value={clicks30d} hint="human clicks, bots excluded" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent click activity */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-base font-bold">Recent redirect activity</h2>
          {recent.length === 0 ? (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground">
              No clicks yet. Share a <code className="font-mono">/go/dubai-rentalcars</code>{' '}
              style link and it will show up here.
            </p>
          ) : (
            <ul className="mt-4 divide-y">
              {recent.map((click, i) => (
                <li
                  key={`${click.slug}-${click.clickedAt.getTime()}-${i}`}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-teal-800">
                    /go/{click.slug}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    {click.country ? `${click.country} · ` : ''}
                    {click.deviceType ? `${click.deviceType} · ` : ''}
                    {click.clickedAt.toISOString().replace('T', ' ').slice(0, 19)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick actions */}
        <section className="space-y-3">
          <h2 className="text-base font-bold">Quick actions</h2>
          {[
            { href: '/admin/redirects/new', label: 'Create a redirect link' },
            { href: '/admin/articles/new', label: 'Write a new article' },
            { href: '/admin/partners/rentalcars', label: 'Edit Rentalcars embed' },
            { href: '/admin/settings', label: 'Site settings' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-teal-50"
            >
              {action.label}
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}