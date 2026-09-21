/**
 * One-time migration script: imports the static MDX articles, destinations and
 * partners into the database. The DB becomes the live source of truth; the
 * MDX/static files remain as the seed source and safe fallback.
 *
 * Usage:
 *   npm run db:seed            # imports only tables that are empty
 *   npm run db:seed -- --force # re-import everything (upsert)
 *
 * Set TURSO_DATABASE_URL / TURSO_AUTH_TOKEN (or LIBSQL_URL / LIBSQL_AUTH_TOKEN)
 * to seed a remote (Turso) DB.
 */
import { ensureTables } from '@/lib/db/client';
import { getArticleMeta, getArticleSlugs, getArticleSource } from '@/lib/content';
import { destinations as staticDestinations } from '@/lib/destinations';
import { PARTNERS, type PartnerId } from '@/lib/partners';
import { healMojibake } from '@/lib/encoding/mojibake';

const LOCALES = ['en', 'fr', 'es', 'ar'] as const;
const force = process.argv.includes('--force');

/**
 * Safety net against ever re-corrupting the DB from a bad source file: if a
 * static string is UTF-8 mojibake (e.g. "ØªØ£Ø¬ÙŠØ± …" or "chÃ¨res"), heal it
 * before the write. Proper Arabic, accented Latin and other text pass through
 * untouched.
 */
const heal = (value: string) => healMojibake(value) ?? value;

async function seedArticles() {
  const { countArticles, saveArticle } = await import('@/lib/db/repositories/articles');
  if (!force && (await countArticles()) > 0) {
    console.log('· articles: table already has rows — skipping (use --force to re-import)');
    return 0;
  }
  let total = 0;
  for (const locale of LOCALES) {
    for (const slug of getArticleSlugs(locale)) {
      const meta = getArticleMeta(locale, slug);
      const body = getArticleSource(locale, slug);
      if (!meta || body === null) continue;
      await saveArticle({
        slug,
        locale,
        status: 'published',
        title: heal(meta.title),
        excerpt: heal(meta.excerpt),
        metaTitle: heal(meta.metaTitle),
        metaDescription: heal(meta.metaDescription),
        image: meta.image,
        date: meta.date,
        readingTime: heal(meta.readingTime),
        destination: meta.destination,
        widgetPartner: meta.widget?.partner,
        widgetCity: heal(meta.widget?.city ?? ''),
        widgetCountry: heal(meta.widget?.country ?? ''),
        body: heal(body),
      });
      total += 1;
    }
  }
  console.log(`· articles: imported ${total} rows`);
  return total;
}

async function seedDestinations() {
  const { listAllDestinationRows, saveDestination } = await import(
    '@/lib/db/repositories/destinations'
  );
  const existing = await listAllDestinationRows();
  if (!force && existing.length > 0) {
    console.log('· destinations: table already has rows — skipping (use --force to re-import)');
    return 0;
  }
  let total = 0;
  for (const destination of staticDestinations) {
    for (const locale of LOCALES) {
      const localized =
        destination.i18n[locale as keyof typeof destination.i18n] ??
        destination.i18n.en;
      await saveDestination({
        slug: destination.slug,
        locale,
        name: heal(localized.name),
        country: heal(localized.country),
        city: heal(localized.city),
        tagline: heal(localized.tagline),
        description: heal(localized.description),
        highlights: localized.highlights.map(heal),
        priceFrom: localized.priceFrom,
        image: destination.image,
        weight: destination.weight,
        active: true,
      });
      total += 1;
    }
  }
  console.log(`· destinations: imported ${total} rows`);
  return total;
}

async function seedPartners() {
  const { listAllPartnerRows, savePartner } = await import(
    '@/lib/db/repositories/partners'
  );
  const existing = await listAllPartnerRows();
  if (!force && existing.length > 0) {
    console.log('· partners: table already has rows — skipping (use --force to re-import)');
    return 0;
  }
  let total = 0;
  for (const partner of Object.values(PARTNERS)) {
    for (const locale of LOCALES) {
      await savePartner({
        id: partner.id as PartnerId,
        locale,
        name: heal(partner.name),
        shortName: heal(partner.shortName),
        tagline: heal(partner.tagline),
        baseUrl: partner.baseUrl,
        color: partner.color,
        commissionNote: heal(partner.commissionNote),
        embed: partner.embed,
        active: true,
        marker: undefined,
        subId: undefined,
      });
      total += 1;
    }
  }
  console.log(`· partners: imported ${total} rows`);
  return total;
}

async function main() {
  console.log(`Seeding Gsirigo database${force ? ' (--force)' : ''}…`);
  await ensureTables();
  const [articles, destinations, partners] = await Promise.all([
    seedArticles(),
    seedDestinations(),
    seedPartners(),
  ]);
  console.log(
    `Done — ${articles + destinations + partners} rows total (articles ${articles}, destinations ${destinations}, partners ${partners}).`
  );
  process.exit(0);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});