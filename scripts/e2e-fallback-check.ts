/**
 * Behavior matrix for the hybrid DB/static fallback (articles + destinations).
 *
 * Scenarios (set LIBSQL_URL + E2E_FALLBACK_SCENARIO):
 *   seed   → temp DB seeded:    'en' → DB rows (bodies non-empty); destinations DB rows.
 *   emptied→ temp DB seeded then 'ar' rows deleted: 'ar' → [] , 'en' → still DB rows.
 *   empty  → zero-row temp DB:  fallback to static catalogue for all locales.
 *   down   → unreachable remote URL: fallback to static catalogue.
 *
 * Run: npx tsx scripts/e2e-fallback-check.ts
 */
import { createClient } from '@libsql/client';
import { getAllArticles } from '../lib/db/repositories/articles';
import { getAllDestinations } from '../lib/db/repositories/destinations';

const scenario = process.env.E2E_FALLBACK_SCENARIO ?? 'seed';
const url = process.env.LIBSQL_URL ?? 'file:data/e2e-tmp.db';

const prep = createClient({ url });

let failures = 0;

function check(label: string, cond: boolean, detail: string) {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label} — ${detail}`);
  if (!cond) failures++;
}

async function main() {
  console.log(`fallback matrix → scenario=${scenario} db=${url}`);

  if (scenario === 'emptied') {
    await prep.execute(`DELETE FROM articles WHERE locale='ar'`);
  }

  if (scenario === 'seed' || scenario === 'emptied') {
    const en = await getAllArticles('en');
    check('articles en: DB rows (seeded)', en.length === 10 && en.every((a) => a.body !== ''), `${en.length} rows, bodies ${en.every((a) => a.body !== '') ? 'set' : 'EMPTY'}`);
    const ar = await getAllArticles('ar');
    if (scenario === 'seed') {
      check('articles ar: DB rows (seeded)', ar.length === 10 && ar.every((a) => a.body !== ''), `${ar.length} rows`);
    } else {
      check('articles ar: [] after locale emptied', ar.length === 0, `${ar.length} rows`);
    }
    const dest = await getAllDestinations('en');
    check('destinations en: DB rows (seeded)', dest.length === 6 && dest.every((d) => d.image.startsWith('https://images.unsplash.com')), `${dest.length} rows, images from DB`);
  }

  if (scenario === 'empty') {
    const en = await getAllArticles('en');
    check('articles en: static fallback on empty DB', en.length === 10 && en.every((a) => a.body === ''), `${en.length} static rows, bodies empty`);
    const fr = await getAllArticles('fr');
    check('articles fr: static fallback on empty DB', fr.length === 10, `${fr.length} static rows`);
    const dest = await getAllDestinations('en');
    check('destinations en: static fallback on empty DB', dest.length === 6, `${dest.length} static rows`);
  }

  if (scenario === 'down') {
    const en = await getAllArticles('en');
    check('articles en: static fallback when DB unreachable', en.length === 10 && en.every((a) => a.body === ''), `${en.length} static rows`);
    const dest = await getAllDestinations('en');
    check('destinations en: static fallback when DB unreachable', dest.length === 6, `${dest.length} static rows`);
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASS' : `${failures} CHECK(S) FAILED`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error('fallback check crashed:', e);
  process.exitCode = 1;
});