import { and, desc, eq } from 'drizzle-orm';
import { articles, type ArticleRow } from '@/db/schema';
import { getDb, withDb } from '@/lib/db/client';
import type { ArticleFrontmatter } from '@/lib/content';
import {
  getArticleMeta as getStaticMeta,
  getArticleSlugs as getStaticSlugs,
} from '@/lib/content';

export const LOCALES = ['en', 'fr', 'es', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export type ManagedArticle = {
  slug: string;
  locale: string;
  status: 'draft' | 'published';
  meta: ArticleFrontmatter;
  /** Raw MDX body */
  body: string;
};

export function rowToManagedArticle(row: ArticleRow): ManagedArticle {
  return {
    slug: row.slug,
    locale: row.locale,
    status: row.status,
    meta: {
      title: row.title,
      excerpt: row.excerpt,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      image: row.image,
      date: row.date,
      readingTime: row.readingTime,
      destination: row.destination ?? undefined,
      widget: {
        partner: row.widgetPartner ?? undefined,
        city: row.widgetCity ?? undefined,
        country: row.widgetCountry ?? undefined,
      },
    },
    body: row.body,
  };
}

export type ArticleSaveInput = {
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
  destination?: string;
  widgetPartner?: string;
  widgetCity?: string;
  widgetCountry?: string;
  body: string;
};

const EMPTY: ArticleRow[] = [];

/**
 * Source of truth = DB. Falls back to the static MDX catalogue (the seed
 * source) so the site keeps working if the DB is empty or unreachable.
 */
export async function getAllArticles(
  locale: string,
  includeDrafts = false
): Promise<ManagedArticle[]> {
  let fallback = true;
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(articles)
      .where(eq(articles.locale, locale))
      .orderBy(desc(articles.date));
    const visible = includeDrafts ? rows : rows.filter((r) => r.status === 'published');
    if (visible.length > 0) {
      fallback = false;
      return visible
        .map(rowToManagedArticle)
        .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
    }
  } catch {
    fallback = true;
  }

  if (!fallback) return [];
  // Static MDX fallback (seed source, never the live source of truth).
  return getStaticSlugs(locale)
    .map((slug) => {
      const meta = getStaticMeta(locale, slug);
      return meta
        ? { slug, locale, status: 'published' as const, meta, body: '' }
        : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
}

/** Fetch one article (published only unless includeDrafts). DB-first. */
export async function getArticle(
  locale: string,
  slug: string,
  includeDrafts = false
): Promise<ManagedArticle | null> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.locale, locale)))
      .limit(1);
    const row = rows[0];
    if (row && (includeDrafts || row.status === 'published')) {
      return rowToManagedArticle(row);
    }
  } catch {
    // fall through to static source.
  }

  const meta = getStaticMeta(locale, slug);
  if (!meta) return null;
  return { slug, locale, status: 'published', meta, body: '' };
}

/** Published slugs that exist for a locale (DB rows ∪ static catalogue). */
export async function listArticleSlugs(locale: string): Promise<string[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({ slug: articles.slug })
      .from(articles)
      .where(
        and(eq(articles.locale, locale), eq(articles.status, 'published'))
      );
    const dbSlugs = rows.map((r) => r.slug);
    if (dbSlugs.length > 0) return dbSlugs;
  } catch {
    // fall through
  }
  return getStaticSlugs(locale);
}

export async function saveArticle(input: ArticleSaveInput): Promise<void> {
  await withDb(async (db) => {
    const now = new Date();
    const base = {
      slug: input.slug.trim(),
      locale: input.locale,
      status: input.status,
      title: input.title,
      excerpt: input.excerpt,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      image: input.image,
      date: input.date,
      readingTime: input.readingTime,
      destination: input.destination?.trim() || null,
      widgetPartner: input.widgetPartner?.trim() || null,
      widgetCity: input.widgetCity?.trim() || null,
      widgetCountry: input.widgetCountry?.trim() || null,
      body: input.body,
    };
    await db
      .insert(articles)
      .values({ ...base, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [articles.slug, articles.locale],
        set: { ...base, updatedAt: now },
      });
  });
}

export async function deleteArticle(slug: string, locale: string): Promise<void> {
  await withDb(async (db) => {
    await db
      .delete(articles)
      .where(and(eq(articles.slug, slug), eq(articles.locale, locale)));
  });
}

/** Admin: every article row across all 4 locales. */
export async function listAllArticleRows(): Promise<ArticleRow[]> {
  try {
    const db = getDb();
    return await db.select().from(articles).orderBy(desc(articles.date));
  } catch {
    return EMPTY;
  }
}

export async function getArticleRow(
  locale: string,
  slug: string
): Promise<ArticleRow | null> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.locale, locale)))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function countArticles(): Promise<number> {
  try {
    const db = getDb();
    const rows = await db.select({ slug: articles.slug }).from(articles);
    return rows.length;
  } catch {
    return 0;
  }
}