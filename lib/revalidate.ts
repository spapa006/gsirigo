import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * On-demand revalidation helpers called from admin API routes after saving,
 * so public pages pick up changes without a redeploy.
 */

export const TAGS = {
  articles: 'articles',
  destinations: 'destinations',
} as const;

/** After any article create/update/delete. */
export function revalidateArticle(locale: string, slug: string): void {
  revalidateTag(TAGS.articles, 'max');
  revalidatePath(`/${locale}/articles`);
  revalidatePath(`/${locale}/articles/${slug}`);
  revalidatePath(`/${locale}`);
  revalidatePath('/sitemap.xml');
}

/** After any destination save/delete. */
export function revalidateDestination(locale: string, slug: string): void {
  revalidateTag(TAGS.destinations, 'max');
  revalidatePath(`/${locale}/destinations`);
  revalidatePath(`/${locale}/destinations/${slug}`);
  revalidatePath(`/${locale}`);
  revalidatePath('/sitemap.xml');
}

/** After partner or site-wide settings changes. */
export function revalidateSiteWide(): void {
  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
  revalidatePath('/robots.txt');
}