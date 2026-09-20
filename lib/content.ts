import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export type ArticleFrontmatter = {
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  image: string;
  date: string; // YYYY-MM-DD
  readingTime: string; // e.g. "6 min read"
  /** Related destination slug (optional) */
  destination?: string;
  /** Widget prefill used inside the article body */
  widget?: {
    partner?: string;
    city?: string;
    country?: string;
  };
};

export type LegalFrontmatter = {
  title: string;
  /** YYYY-MM-DD last-updated date */
  updated: string;
};

export type Article = {
  slug: string;
  meta: ArticleFrontmatter;
};

const readDir = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
};

const readSource = (locale: string, type: 'articles' | 'legal', slug: string): string | null => {
  const file = path.join(CONTENT_DIR, locale, type, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
};

/* -------------------------------- Articles ------------------------------- */

export function getArticleSlugs(locale: string): string[] {
  return readDir(path.join(CONTENT_DIR, locale, 'articles'));
}

export function getArticleMeta(locale: string, slug: string): ArticleFrontmatter | null {
  const source = readSource(locale, 'articles', slug);
  if (!source) return null;
  const { data } = matter(source);
  return data as unknown as ArticleFrontmatter;
}

export function getArticleSource(locale: string, slug: string): string | null {
  return readSource(locale, 'articles', slug);
}

export function getAllArticles(locale: string): Article[] {
  return getArticleSlugs(locale)
    .map((slug) => ({ slug, meta: getArticleMeta(locale, slug)! }))
    .filter((a) => a.meta)
    .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
}

/* --------------------------------- Legal --------------------------------- */

export function getLegalSlugs(locale: string): string[] {
  return readDir(path.join(CONTENT_DIR, locale, 'legal'));
}

export function getLegalMeta(locale: string, slug: string): LegalFrontmatter | null {
  const source = readSource(locale, 'legal', slug);
  if (!source) return null;
  const { data } = matter(source);
  return data as unknown as LegalFrontmatter;
}

export function getLegalSource(locale: string, slug: string): string | null {
  return readSource(locale, 'legal', slug);
}