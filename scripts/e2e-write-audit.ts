/**
 * E2E write-path audit for every admin-managed entity.
 *
 * Drives the real admin API (login → session cookie → create → verify row in
 * the DB → delete/restore), exactly like the admin UI does.
 *
 * Run against a local `next start`/`next dev`:
 *   npx tsx scripts/e2e-write-audit.ts
 *
 * The local file DB (data/gsirigo.db) stands in for the remote Turso DB here;
 * the point is to prove the full wiring (auth, CSRF, validation, DB write,
 * response shape) for each entity.
 */
import { createClient } from '@libsql/client';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const EMAIL = process.env.ADMIN_EMAIL ?? 'rdouanben@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD ?? 'gsirigo@com';
const DB_URL = process.env.E2E_DB_URL ?? 'file:data/gsirigo.db';

const db = createClient({ url: DB_URL });

type Result = { entity: string; created: boolean; rowLanded: boolean; cleanedUp: boolean; error?: string };

const results: Result[] = [];

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`login failed (${res.status}): ${await res.text()}`);
  }
  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookie = setCookie.split(';')[0];
  if (!cookie) throw new Error('no session cookie returned');
  return cookie;
}

async function api(
  method: string,
  path: string,
  cookie: string,
  body?: unknown
): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE,
      Cookie: cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* non-JSON (e.g. Next 500 HTML) — keep raw text for diagnostics */
  }
  return { status: res.status, data };
}

async function countRows(table: string, where: string): Promise<number> {
  const r = await db.execute(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`);
  return Number(r.rows[0]?.n ?? 0);
}

function record(
  r: Result,
  status: number,
  name: string,
  expectedOk = 200
): boolean {
  r.created = requestStatus(status, expectedOk);
  if (!r.created) r.error = `HTTP ${status} from ${name}`;
  return r.created;
}

function requestStatus(status: number, expected: number): boolean {
  return status === expected;
}

async function main() {
  console.log(`E2E write audit → ${BASE} (DB: ${DB_URL})`);
  let cookie: string;
  try {
    cookie = await login();
    console.log('  login: OK');
  } catch (e) {
    console.error(`  login: FAILED — ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
    return;
  }

  /* ------------------------------- Articles ------------------------------ */
  {
    const r: Result = { entity: 'articles', created: false, rowLanded: false, cleanedUp: false };
    const slug = 'e2e-audit-article';
    const body = {
      slug,
      locale: 'en',
      status: 'draft',
      title: 'E2E Audit Article',
      excerpt: 'audit row',
      metaTitle: '',
      metaDescription: '',
      image: '',
      date: '2026-09-21',
      readingTime: '1 min read',
      destination: undefined,
      body: '# Audit\n\nrow created by the e2e write audit.',
    };
    const res = await api('POST', '/api/admin/articles', cookie, body);
    if (record(r, res.status, 'POST /api/admin/articles')) {
      r.rowLanded =
        (await countRows('articles', `slug='${slug}' AND locale='en'`)) === 1;
      const del = await api('DELETE', `/api/admin/articles?slug=${slug}&locale=en`, cookie);
      r.cleanedUp = del.status === 200 && (await countRows('articles', `slug='${slug}'`)) === 0;
    }
    if (!r.rowLanded) r.error = r.error ?? 'row not found in articles table';
    results.push(r);
  }

  /* ----------------------------- Destinations ---------------------------- */
  {
    const r: Result = { entity: 'destinations', created: false, rowLanded: false, cleanedUp: false };
    const slug = 'e2e-audit-dest';
    const body = {
      slug,
      locale: 'en',
      name: 'E2E Audit Destination',
      country: 'Testland',
      city: 'Testville',
      tagline: 'audit',
      description: 'row created by the e2e write audit',
      highlights: ['One', 'Two'],
      priceFrom: '$99',
      image: '',
      weight: 1,
      active: true,
    };
    const res = await api('POST', '/api/admin/destinations', cookie, body);
    if (record(r, res.status, 'POST /api/admin/destinations')) {
      r.rowLanded =
        (await countRows('destinations', `slug='${slug}' AND locale='en'`)) === 1;
      const del = await api('DELETE', `/api/admin/destinations?slug=${slug}&locale=en`, cookie);
      r.cleanedUp = del.status === 200 && (await countRows('destinations', `slug='${slug}'`)) === 0;
    }
    if (!r.rowLanded) r.error = r.error ?? 'row not found in destinations table';
    results.push(r);
  }

  /* ------------------------------- Partners ------------------------------ */
  {
    const r: Result = { entity: 'partners', created: false, rowLanded: false, cleanedUp: false };
    const saved = await db.execute(
      `SELECT * FROM partners WHERE id='rentalcars' AND locale='en'`
    );
    const original = saved.rows[0];
    const body = {
      id: 'rentalcars',
      locale: 'en',
      name: 'Rentalcars E2E',
      shortName: 'RC',
      tagline: 'audit tagline',
      baseUrl: 'https://www.rentalcars.com',
      color: '#123456',
      commissionNote: 'audit',
      embed: '',
      active: true,
    };
    const res = await api('POST', '/api/admin/partners', cookie, body);
    if (record(r, res.status, 'POST /api/admin/partners')) {
      r.rowLanded =
        (await countRows('partners', `id='rentalcars' AND locale='en' AND name='Rentalcars E2E'`)) === 1;
      // restore the pre-test row
      const restore = await api('POST', '/api/admin/partners', cookie, {
        id: 'rentalcars',
        locale: 'en',
        name: String(original?.name ?? ''),
        shortName: String(original?.short_name ?? ''),
        tagline: String(original?.tagline ?? ''),
        baseUrl: String(original?.base_url ?? ''),
        color: String(original?.color ?? '#1d4ed8'),
        commissionNote: String(original?.commission_note ?? ''),
        embed: String(original?.embed ?? ''),
        active: Boolean(original?.active ?? true),
        marker: original?.marker ? String(original.marker) : undefined,
        subId: original?.sub_id ? String(original.sub_id) : undefined,
      });
      r.cleanedUp = restore.status === 200;
    }
    if (!r.rowLanded) r.error = r.error ?? 'row not found / not updated in partners table';
    results.push(r);
  }

  /* ------------------------------ Redirects ------------------------------ */
  {
    const r: Result = { entity: 'redirects', created: false, rowLanded: false, cleanedUp: false };
    const slug = 'e2e-audit-redirect';
    const body = {
      slug,
      destinationUrl: 'https://example.com/audit',
      partner: null,
      label: 'e2e audit',
      isActive: true,
    };
    const res = await api('POST', '/api/admin/redirects', cookie, body);
    if (record(r, res.status, 'POST /api/admin/redirects')) {
      r.rowLanded =
        (await countRows('redirect_links', `slug='${slug}'`)) === 1;
      const del = await api('DELETE', `/api/admin/redirects/${slug}`, cookie);
      r.cleanedUp = del.status === 200 && (await countRows('redirect_links', `slug='${slug}'`)) === 0;
    }
    if (!r.rowLanded) r.error = r.error ?? 'row not found in redirect_links table';
    results.push(r);
  }

  /* ------------------------------- Settings ------------------------------ */
  {
    const r: Result = { entity: 'settings', created: false, rowLanded: false, cleanedUp: false };
    const saved = await db.execute(`SELECT value FROM site_settings WHERE key='site_url'`);
    const original = saved.rows[0]?.value ?? '';
    const res = await api('POST', '/api/admin/settings', cookie, { site_url: 'https://e2e-audit.invalid' });
    if (record(r, res.status, 'POST /api/admin/settings')) {
      const check = await db.execute(`SELECT value FROM site_settings WHERE key='site_url'`);
      r.rowLanded = check.rows[0]?.value === 'https://e2e-audit.invalid';
      const restore = await api('POST', '/api/admin/settings', cookie, { site_url: original });
      r.cleanedUp = restore.status === 200;
    }
    if (!r.rowLanded) r.error = r.error ?? 'site_url not persisted in site_settings table';
    results.push(r);
  }

  /* ------------------- Auth gate sanity (expected 401) ------------------- */
  {
    const anon = await fetch(`${BASE}/api/admin/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: BASE },
      body: JSON.stringify({
        slug: 'e2e-auth-probe',
        locale: 'en',
        title: 'x',
        body: 'x',
      }),
    });
    console.log(`  unauthenticated POST → ${anon.status} (expected 401): ${anon.status === 401 ? 'OK' : 'UNEXPECTED'}`);
  }

  console.log('\nResults:');
  console.log('entity       | API called DB (HTTP 200) | row landed | cleaned up | error');
  console.log('-------------|--------------------------|------------|------------|------');
  for (const r of results) {
    console.log(
      `${r.entity.padEnd(12)} | ${String(r.created).padEnd(25)} | ${String(r.rowLanded).padEnd(11)} | ${String(r.cleanedUp).padEnd(11)} | ${r.error ?? ''}`
    );
  }
  const ok = results.every((r) => r.created && r.rowLanded && r.cleanedUp);
  console.log(`\nOVERALL: ${ok ? 'ALL ENTITIES PASS' : 'FAILURES PRESENT'}`);
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => {
  console.error('e2e audit crashed:', e);
  process.exitCode = 1;
});