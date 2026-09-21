/**
 * Live revalidation check (directive item 5): after a save, the change must
 * appear on the public site without a redeploy.
 *
 *   articles      → create published article, GET /en/articles/<slug>, update
 *                   title, GET again (must show updated title), delete.
 *   destinations  → same for /en/destinations/<slug>.
 *   settings      → set affiliate_disclosure marker, GET /en (footer must show
 *                   it), restore original, GET /en again (must be gone).
 *
 * Run: npx tsx scripts/e2e-revalidate-check.ts
 */
import { createClient } from '@libsql/client';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.ADMIN_EMAIL ?? 'rdouanben@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'gsirigo@com';
const DB_URL = process.env.E2E_DB_URL ?? 'file:data/gsirigo.db';

const db = createClient({
  url: DB_URL,
  // Needed when E2E_DB_URL points at a remote Turso DB (LIBSQL_URL).
  authToken: process.env.TURSO_AUTH_TOKEN ?? process.env.LIBSQL_AUTH_TOKEN,
});
const TS = Date.now().toString(36);

let failures = 0;

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed (${res.status}): ${await res.text()}`);
  const cookie = (res.headers.get('set-cookie') ?? '').split(';')[0];
  if (!cookie) throw new Error('no session cookie');
  return cookie;
}

async function api(method: string, path: string, cookie: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: BASE, Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.text() };
}

async function getHtml(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.text();
}

async function check(label: string, cond: boolean, detail: string) {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${label} — ${detail}`);
  if (!cond) failures++;
}

async function main() {
  console.log(`Revalidation check → ${BASE}`);
  const cookie = await login();

  /* ------------------------------- Articles ------------------------------ */
  const articleSlug = `e2e-reval-article-${TS}`;
  const title1 = `E2E Reval Article v1 ${TS}`;
  const title2 = `E2E Reval Article v2 ${TS}`;
  console.log('articles:');
  await api('POST', '/api/admin/articles', cookie, {
    slug: articleSlug, locale: 'en', status: 'published', title: title1,
    excerpt: 'reval', metaTitle: '', metaDescription: '', image: '',
    date: '2026-09-21', readingTime: '1 min read', body: '# Marker\n\nbody',
  });
  const html1 = await getHtml(`/en/articles/${articleSlug}`);
  await check('create visible on /en/articles/<slug>', html1.includes(title1), `contains "${title1}"`);
  await api('POST', '/api/admin/articles', cookie, {
    slug: articleSlug, locale: 'en', status: 'published', title: title2,
    excerpt: 'reval', metaTitle: '', metaDescription: '', image: '',
    date: '2026-09-21', readingTime: '1 min read', body: '# Marker v2\n\nbody',
  });
  const html2 = await getHtml(`/en/articles/${articleSlug}`);
  await check('update visible without redeploy', html2.includes(title2) && !html2.includes(title1), `contains "${title2}"`);
  await api('DELETE', `/api/admin/articles?slug=${articleSlug}&locale=en`, cookie);

  /* ----------------------------- Destinations ---------------------------- */
  const destSlug = `e2e-reval-dest-${TS}`;
  const name1 = `E2E Reval Dest v1 ${TS}`;
  const name2 = `E2E Reval Dest v2 ${TS}`;
  console.log('destinations:');
  await api('POST', '/api/admin/destinations', cookie, {
    slug: destSlug, locale: 'en', name: name1, country: 'Testland', city: 'Testville',
    tagline: 'reval', description: 'reval row', highlights: [], priceFrom: '$1',
    image: '', weight: 1, active: true,
  });
  const d1 = await getHtml(`/en/destinations/${destSlug}`);
  await check('create visible on /en/destinations/<slug>', d1.includes(name1), `contains "${name1}"`);
  await api('POST', '/api/admin/destinations', cookie, {
    slug: destSlug, locale: 'en', name: name2, country: 'Testland', city: 'Testville',
    tagline: 'reval', description: 'reval row v2', highlights: [], priceFrom: '$1',
    image: '', weight: 1, active: true,
  });
  const d2 = await getHtml(`/en/destinations/${destSlug}`);
  await check('update visible without redeploy', d2.includes(name2) && !d2.includes(name1), `contains "${name2}"`);
  await api('DELETE', `/api/admin/destinations?slug=${destSlug}&locale=en`, cookie);

  /* ------------------------------- Settings ------------------------------ */
  const marker = `e2e-reval-settings-marker-${TS}`;
  const saved = await db.execute(`SELECT value FROM site_settings WHERE key='affiliate_disclosure'`);
  const original = saved.rows[0]?.value ?? '';
  console.log('settings:');
  await api('POST', '/api/admin/settings', cookie, { affiliate_disclosure: marker });
  const home1 = await getHtml('/en');
  await check('affiliate_disclosure visible in footer without redeploy', home1.includes(marker), `footer contains "${marker}"`);
  await api('POST', '/api/admin/settings', cookie, { affiliate_disclosure: original });
  const home2 = await getHtml('/en');
  await check('restore removes marker', !home2.includes(marker), 'footer marker gone after restore');

  console.log(`\nOVERALL: ${failures === 0 ? 'ALL REVALIDATION CHECKS PASS' : `${failures} CHECK(S) FAILED`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((e) => {
  console.error('revalidation check crashed:', e);
  process.exitCode = 1;
});