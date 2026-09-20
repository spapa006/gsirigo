import { and, asc, eq } from 'drizzle-orm';
import { destinations } from '@/db/schema';
import { getDb, withDb } from '@/lib/db/client';
import type { DestinationLocalized } from '@/lib/destinations';
import {
  destinations as staticDestinations,
  getDestination as getStaticDestination,
} from '@/lib/destinations';

/** A destination as rendered on the public site (DB-first). */
export type ManagedDestination = {
  slug: string;
  image: string;
  weight: number;
  localized: DestinationLocalized;
};

function rowToLocalized(row: (typeof destinations.$inferSelect)): DestinationLocalized {
  return {
    name: row.name,
    country: row.country,
    city: row.city,
    tagline: row.tagline,
    description: row.description,
    highlights: safeParseHighlights(row.highlights),
    priceFrom: row.priceFrom,
  };
}

function safeParseHighlights(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * All destinations for a locale. DB rows (active only) take precedence; falls
 * back to the static catalogue when the DB has no rows for this locale.
 */
export async function getAllDestinations(locale: string): Promise<ManagedDestination[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(destinations)
      .where(eq(destinations.locale, locale))
      .orderBy(asc(destinations.weight));
    if (rows.length > 0) {
      return rows
        .filter((r) => r.active)
        .sort((a, b) => a.weight - b.weight)
        .map((r) => ({
          slug: r.slug,
          image: r.image,
          weight: r.weight,
          localized: rowToLocalized(r),
        }));
    }
  } catch {
    // fall through to static
  }

  return staticDestinations
    .slice()
    .sort((a, b) => a.weight - b.weight)
    .map((d) => {
      const localized = d.i18n[locale as keyof typeof d.i18n] ?? d.i18n.en;
      return {
        slug: d.slug,
        image: d.image,
        weight: d.weight,
        localized: {
          ...localized,
          city: localized.city,
        },
      };
    });
}

export async function getManagedDestination(
  slug: string,
  locale: string
): Promise<ManagedDestination | null> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(destinations)
      .where(and(eq(destinations.slug, slug), eq(destinations.locale, locale)))
      .limit(1);
    const row = rows[0];
    if (row) {
      if (!row.active) return null;
      return {
        slug: row.slug,
        image: row.image,
        weight: row.weight,
        localized: rowToLocalized(row),
      };
    }
  } catch {
    // fall through
  }

  const staticDest = getStaticDestination(slug);
  if (!staticDest) return null;
  const localized =
    staticDest.i18n[locale as keyof typeof staticDest.i18n] ?? staticDest.i18n.en;
  return {
    slug: staticDest.slug,
    image: staticDest.image,
    weight: staticDest.weight,
    localized,
  };
}

/** Slugs that exist for a locale (DB ∪ static), for generateStaticParams. */
export async function listDestinationSlugs(locale: string): Promise<string[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({ slug: destinations.slug })
      .from(destinations)
      .where(eq(destinations.locale, locale));
    const slugs = rows.map((r) => r.slug);
    if (slugs.length > 0) return slugs;
  } catch {
    // fall through
  }
  return staticDestinations.map((d) => d.slug);
}

export type DestinationSaveInput = {
  slug: string;
  locale: string;
  name: string;
  country: string;
  city: string;
  tagline: string;
  description: string;
  highlights: string[];
  priceFrom: string;
  image: string;
  weight: number;
  active: boolean;
};

export async function saveDestination(input: DestinationSaveInput): Promise<void> {
  await withDb(async (db) => {
    const base = {
      slug: input.slug.trim(),
      locale: input.locale,
      name: input.name,
      country: input.country,
      city: input.city,
      tagline: input.tagline,
      description: input.description,
      highlights: JSON.stringify(input.highlights ?? []),
      priceFrom: input.priceFrom,
      image: input.image,
      weight: input.weight,
      active: input.active,
    };
    await db
      .insert(destinations)
      .values(base)
      .onConflictDoUpdate({
        target: [destinations.slug, destinations.locale],
        set: { ...base },
      });
  });
}

export async function deleteDestination(slug: string, locale: string): Promise<void> {
  await withDb(async (db) => {
    await db
      .delete(destinations)
      .where(and(eq(destinations.slug, slug), eq(destinations.locale, locale)));
  });
}

/** Admin: raw rows grouped view for the management table. */
export async function listAllDestinationRows() {
  try {
    const db = getDb();
    return await db.select().from(destinations).orderBy(asc(destinations.weight));
  } catch {
    return [];
  }
}

export async function getDestinationRow(
  locale: string,
  slug: string
): Promise<(typeof destinations.$inferSelect) | null> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(destinations)
      .where(and(eq(destinations.slug, slug), eq(destinations.locale, locale)))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function countDestinationSlugs(): Promise<number> {
  try {
    const db = getDb();
    const rows = await db
      .select({ slug: destinations.slug })
      .from(destinations);
    return new Set(rows.map((r) => r.slug)).size;
  } catch {
    return staticDestinations.length;
  }
}