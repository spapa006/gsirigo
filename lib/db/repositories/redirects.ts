import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { redirectClicks, redirectLinks, type RedirectLinkRow } from '@/db/schema';
import { getDb, withDb } from '@/lib/db/client';

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
      .values({
        slug: input.slug.trim(),
        destinationUrl: input.destinationUrl.trim(),
        partner: input.partner?.trim() || null,
        label: input.label?.trim() ?? '',
        isActive: input.isActive,
        clickCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: redirectLinks.slug,
        set: {
          destinationUrl: input.destinationUrl.trim(),
          partner: input.partner?.trim() || null,
          label: input.label?.trim() ?? '',
          isActive: input.isActive,
          updatedAt: now,
        },
      });
  });
}

export async function deleteRedirect(slug: string): Promise<void> {
  await withDb(async (db) => {
    await db.delete(redirectLinks).where(eq(redirectLinks.slug, slug));
    await db.delete(redirectClicks).where(eq(redirectClicks.slug, slug));
  });
}

/**
 * Adds one click. Called from the /go route AFTER the 302 is issued (via
 * `after()`), so it never blocks the redirect.
 */
export async function recordClick(slug: string): Promise<void> {
  try {
    const db = getDb();
    await db
      .update(redirectLinks)
      .set({ clickCount: sql`${redirectLinks.clickCount} + 1` })
      .where(eq(redirectLinks.slug, slug));
    await db.insert(redirectClicks).values({
      id: randomUUID(),
      slug,
      clickedAt: new Date(),
    });
  } catch {
    // Click tracking is best-effort — never fail the redirect.
  }
}

/** Clicks in the last N days (dashboard stat). */
export async function getClicksSince(days: number): Promise<number> {
  try {
    const db = getDb();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await db
      .select({ id: redirectClicks.id })
      .from(redirectClicks)
      .where(gte(redirectClicks.clickedAt, since));
    return rows.length;
  } catch {
    return 0;
  }
}

/** Clicks per link (for the redirects admin table). */
export async function getClickCounts(): Promise<Record<string, number>> {
  try {
    const db = getDb();
    const rows = await db
      .select({ slug: redirectClicks.slug, id: redirectClicks.id })
      .from(redirectClicks);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.slug] = (counts[row.slug] ?? 0) + 1;
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
  { slug: string; clickedAt: Date }[]
> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(redirectClicks)
      .orderBy(desc(redirectClicks.clickedAt))
      .limit(limit);
    return rows.map((r) => ({ slug: r.slug, clickedAt: r.clickedAt }));
  } catch {
    return [];
  }
}

export { and };