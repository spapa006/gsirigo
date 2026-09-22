import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { redirectClicks, redirectClickRollups, redirectLinks } from '@/db/schema';
import type { RedirectLinkRow } from '@/db/schema';
import { getDb, withDb } from '@/lib/db/client';
import type { ClickEvent } from '@/lib/analytics/click-event';

export type RedirectLink = {
  slug: string;
  destinationUrl: string;
  partner: string | null;
  label: string;
  isActive: boolean;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
};

function rowToLink(row: RedirectLinkRow): RedirectLink {
  return {
    slug: row.slug,
    destinationUrl: row.destinationUrl,
    partner: row.partner,
    label: row.label,
    isActive: row.isActive,
    clickCount: row.clickCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listRedirectLinks(): Promise<RedirectLink[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(redirectLinks)
      .orderBy(desc(redirectLinks.updatedAt));
    return rows.map(rowToLink);
  } catch {
    return [];
  }
}

export async function getRedirectLink(slug: string): Promise<RedirectLink | null> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(redirectLinks)
      .where(eq(redirectLinks.slug, slug))
      .limit(1);
    return rows[0] ? rowToLink(rows[0]) : null;
  } catch {
    return null;
  }
}

export type RedirectSaveInput = {
  slug: string;
  destinationUrl: string;
  partner?: string | null;
  label?: string;
  isActive: boolean;
};

export async function saveRedirect(input: RedirectSaveInput): Promise<void> {
  await withDb(async (db) => {
    const now = new Date();
    await db
      .insert(redirectLinks)
      .values({ ...input, clickCount: 0, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: redirectLinks.slug,
        set: {
          destinationUrl: input.destinationUrl,
          partner: input.partner ?? null,
          label: input.label ?? '',
          isActive: input.isActive,
          updatedAt: now,
        },
      });
  });
}

export async function deleteRedirect(slug: string): Promise<void> {
  await withDb(async (db) => {
    await db.delete(redirectClicks).where(eq(redirectClicks.slug, slug));
    await db.delete(redirectClickRollups).where(eq(redirectClickRollups.slug, slug));
    await db.delete(redirectLinks).where(eq(redirectLinks.slug, slug));
  });
}

/**
 * Record one detailed click event and bump the denormalized counter.
 *
 * click_count is incremented ONLY for human (non-bot) clicks so the list's
 * counter always matches COUNT(*) FROM redirect_clicks WHERE slug = ?
 * AND is_bot = 0 (the verification invariant). Bot events are stored but
 * deliberately excluded.
 */
export async function recordClick(slug: string, event: ClickEvent): Promise<void> {
  try {
    await withDb(async (db) => {
      await db.transaction(async (tx) => {
        await tx.insert(redirectClicks).values({
          slug,
          clickedAt: new Date(),
          ipHash: event.ipHash,
          country: event.country,
          city: event.city,
          deviceType: event.deviceType,
          browser: event.browser,
          os: event.os,
          referrer: event.referrer,
          locale: event.locale,
          isBot: event.isBot,
          userAgent: event.userAgent,
        });
        if (!event.isBot) {
          await tx
            .update(redirectLinks)
            .set({ clickCount: sql`${redirectLinks.clickCount} + 1` })
            .where(eq(redirectLinks.slug, slug));
        }
      });
    });
  } catch (error) {
    // Click tracking is best-effort — never fail the redirect — but the real
    // error must still surface in the function log for debugging.
    console.error(`recordClick(${slug}) failed:`, error instanceof Error ? error.message : error);
  }
}

/* --------------------------- Dashboard helpers --------------------------- */

/** Human (non-bot) clicks in the last N days. */
export async function getClicksSince(days: number): Promise<number> {
  try {
    const db = getDb();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const counted = await db
      .select({ count: sql<number>`count(*)` })
      .from(redirectClicks)
      .where(
        and(gte(redirectClicks.clickedAt, since), sql`${redirectClicks.isBot} = 0`)
      );
    return counted[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

/** Human clicks per link (for table tooltips). */
export async function getClickCounts(): Promise<Record<string, number>> {
  try {
    const db = getDb();
    const rows = await db
      .select({ slug: redirectClicks.slug, count: sql<number>`count(*)` })
      .from(redirectClicks)
      .where(sql`${redirectClicks.isBot} = 0`)
      .groupBy(redirectClicks.slug);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.slug] = row.count ?? 0;
    }
    return counts;
  } catch {
    return {};
  }
}

export async function countRedirectLinks(): Promise<number> {
  try {
    const db = getDb();
    const rows = await db.select({ slug: redirectLinks.slug }).from(redirectLinks);
    return rows.length;
  } catch {
    return 0;
  }
}

export async function getRecentClicks(limit = 20): Promise<
  { slug: string; clickedAt: Date; country: string | null; deviceType: string | null }[]
> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        slug: redirectClicks.slug,
        clickedAt: redirectClicks.clickedAt,
        country: redirectClicks.country,
        deviceType: redirectClicks.deviceType,
      })
      .from(redirectClicks)
      .where(sql`${redirectClicks.isBot} = 0`)
      .orderBy(desc(redirectClicks.clickedAt))
      .limit(limit);
    return rows.map((r) => ({
      slug: r.slug,
      clickedAt: r.clickedAt,
      country: r.country,
      deviceType: r.deviceType,
    }));
  } catch {
    return [];
  }
}

/* --------------------------- Analytics queries --------------------------- */

export type AnalyticsBucket = { label: string; count: number };
export type AnalyticsSeriesPoint = { day: string; count: number };
export type RecentClickRow = {
  id: number;
  clickedAt: Date;
  country: string | null;
  city: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  locale: string | null;
  isBot: boolean;
};

export type RedirectAnalytics = {
  /** All-time human clicks (denormalized counter). */
  totalHuman: number;
  /** All-time bot clicks excluded from headline stats. */
  totalBots: number;
  last7: number;
  last30: number;
  series: AnalyticsSeriesPoint[];
  byCountry: AnalyticsBucket[];
  byDevice: AnalyticsBucket[];
  byReferrer: AnalyticsBucket[];
  byLocale: AnalyticsBucket[];
  recent: RecentClickRow[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** SQL fragment appending the human-only filter unless bots are included. */
function humanFilter(includeBots: boolean): ReturnType<typeof sql> {
  return includeBots ? sql`` : sql`AND redirect_clicks.is_bot = 0`;
}

export function rangeStartDate(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

/**
 * Full analytics bundle for one redirect link.
 *
 * `days` controls the series + breakdown windows (default 30, up to 365). All
 * aggregate queries filter by `slug` (and optionally `clicked_at >=`) so they
 * run through idx_redirect_clicks_slug (slug, clicked_at) — verified with
 * EXPLAIN QUERY PLAN before shipping.
 */
export async function getRedirectAnalytics(
  slug: string,
  days: number,
  includeBots: boolean
): Promise<RedirectAnalytics> {
  const empty = {
    totalHuman: 0,
    totalBots: 0,
    last7: 0,
    last30: 0,
    series: [] as AnalyticsSeriesPoint[],
    byCountry: [] as AnalyticsBucket[],
    byDevice: [] as AnalyticsBucket[],
    byReferrer: [] as AnalyticsBucket[],
    byLocale: [] as AnalyticsBucket[],
    recent: [] as RecentClickRow[],
  };

  try {
    const link = await getRedirectLink(slug);
    const [totals, series, byCountry, byDevice, byReferrer, byLocale, recent, last7, last30] =
      await withDb(async (db) => {
        const totals = await db.all<{ totalBots: number }>(sql`
          SELECT count(*) AS totalBots FROM redirect_clicks
          WHERE slug = ${slug} AND redirect_clicks.is_bot = 1
        `);
        const series = await db.all<{ day: string; count: number }>(sql`
          SELECT strftime('%Y-%m-%d', redirect_clicks.clicked_at, 'unixepoch') AS day,
                 count(*) AS count
          FROM redirect_clicks
          WHERE slug = ${slug}
            AND redirect_clicks.clicked_at >= ${Math.floor(rangeStartDate(days).getTime() / 1000)}
            ${humanFilter(includeBots)}
          GROUP BY day
          ORDER BY day ASC
        `);
        const byCountry = await db.all<{ label: string | null; count: number }>(sql`
          SELECT NULLIF(redirect_clicks.country, '') AS label, count(*) AS count
          FROM redirect_clicks
          WHERE slug = ${slug}
            AND redirect_clicks.clicked_at >= ${Math.floor(rangeStartDate(days).getTime() / 1000)}
            ${humanFilter(includeBots)}
          GROUP BY label
          ORDER BY count DESC
          LIMIT 10
        `);
        const byDevice = await db.all<{ label: string | null; count: number }>(sql`
          SELECT redirect_clicks.device_type AS label, count(*) AS count
          FROM redirect_clicks
          WHERE slug = ${slug}
            AND redirect_clicks.clicked_at >= ${Math.floor(rangeStartDate(days).getTime() / 1000)}
            ${humanFilter(includeBots)}
          GROUP BY label
          ORDER BY count DESC
        `);
        const byReferrer = await db.all<{ label: string | null; count: number }>(sql`
          SELECT redirect_clicks.referrer AS label, count(*) AS count
          FROM redirect_clicks
          WHERE slug = ${slug}
            AND redirect_clicks.clicked_at >= ${Math.floor(rangeStartDate(days).getTime() / 1000)}
            ${humanFilter(includeBots)}
          GROUP BY label
          ORDER BY count DESC
          LIMIT 10
        `);
        const byLocale = await db.all<{ label: string | null; count: number }>(sql`
          SELECT NULLIF(redirect_clicks.locale, '') AS label, count(*) AS count
          FROM redirect_clicks
          WHERE slug = ${slug}
            AND redirect_clicks.clicked_at >= ${Math.floor(rangeStartDate(days).getTime() / 1000)}
            ${humanFilter(includeBots)}
          GROUP BY label
          ORDER BY count DESC
        `);
        const recent = await db
          .select()
          .from(redirectClicks)
          .where(
            and(
              eq(redirectClicks.slug, slug),
              includeBots ? undefined : sql`${redirectClicks.isBot} = 0`
            )
          )
          .orderBy(desc(redirectClicks.clickedAt))
          .limit(50);
        const last7 = await db.all<{ count: number }>(sql`
          SELECT count(*) AS count FROM redirect_clicks
          WHERE slug = ${slug}
            AND redirect_clicks.clicked_at >= ${Math.floor(rangeStartDate(7).getTime() / 1000)}
            ${humanFilter(includeBots)}
        `);
        const last30 = await db.all<{ count: number }>(sql`
          SELECT count(*) AS count FROM redirect_clicks
          WHERE slug = ${slug}
            AND redirect_clicks.clicked_at >= ${Math.floor(rangeStartDate(30).getTime() / 1000)}
            ${humanFilter(includeBots)}
        `);
        return [totals, series, byCountry, byDevice, byReferrer, byLocale, recent, last7, last30] as const;
      });

    return {
      totalHuman: link?.clickCount ?? 0,
      totalBots: totals[0]?.totalBots ?? 0,
      last7: last7[0]?.count ?? 0,
      last30: last30[0]?.count ?? 0,
      series,
      byCountry: byCountry.map((r) => ({ label: r.label ?? 'Unknown', count: r.count })),
      byDevice: byDevice.map((r) => ({ label: r.label ?? 'Unknown', count: r.count })),
      byReferrer: byReferrer.map((r) => ({ label: r.label ?? 'Direct', count: r.count })),
      byLocale: byLocale.map((r) => ({ label: r.label ?? 'Unknown', count: r.count })),
      recent: recent.map((r) => ({
        id: r.id,
        clickedAt: r.clickedAt,
        country: r.country,
        city: r.city,
        deviceType: r.deviceType,
        browser: r.browser,
        os: r.os,
        referrer: r.referrer,
        locale: r.locale,
        isBot: r.isBot,
      })),
    };
  } catch {
    return empty;
  }
}

/* ------------------------------ Retention -------------------------------- */

export type PruneResult = { rolledUp: number; pruned: number };

/**
 * Aggregate raw click rows older than `retainMonths` into monthly rollups and
 * delete them, so the event table doesn't grow unbounded on the free tier.
 *
 * Idempotent (rollups upsert by (slug, month)) and atomic (single write
 * transaction). Runs on a Vercel Cron or via the manual admin action.
 */
export async function pruneOldClickEvents(retainMonths = 12): Promise<PruneResult> {
  return withDb(async (db) => {
    const now = new Date();
    const cutoff = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - retainMonths, 1)
    );
    const cutoffSeconds = Math.floor(cutoff.getTime() / 1000);

    return db.transaction(async (tx) => {
      type RollupRow = { slug: string; month: string; clicks: number; bot_clicks: number };
      const rollups = await tx.all<RollupRow>(sql`
        SELECT redirect_clicks.slug AS slug,
               strftime('%Y-%m', redirect_clicks.clicked_at, 'unixepoch') AS month,
               sum(CASE WHEN redirect_clicks.is_bot = 0 THEN 1 ELSE 0 END) AS clicks,
               sum(CASE WHEN redirect_clicks.is_bot = 1 THEN 1 ELSE 0 END) AS bot_clicks
        FROM redirect_clicks
        WHERE redirect_clicks.clicked_at < ${cutoffSeconds}
        GROUP BY redirect_clicks.slug, month
      `);

      let rolledUp = 0;
      for (const row of rollups) {
        await tx
          .insert(redirectClickRollups)
          .values({
            slug: row.slug,
            month: row.month,
            clicks: row.clicks,
            botClicks: row.bot_clicks,
          })
          .onConflictDoUpdate({
            target: [redirectClickRollups.slug, redirectClickRollups.month],
            set: {
              clicks: sql`${redirectClickRollups.clicks} + excluded.clicks`,
              botClicks: sql`${redirectClickRollups.botClicks} + excluded.bot_clicks`,
            },
          });
        rolledUp += 1;
      }

      const deleted = await tx
        .delete(redirectClicks)
        .where(sql`redirect_clicks.clicked_at < ${cutoffSeconds}`);

      return { rolledUp, pruned: deleted.rowsAffected ?? 0 };
    });
  });
}