# Gsirigo — Travelpayouts Car Rental Affiliate Site

Multilingual (🇬🇧 en / 🇫🇷 fr / 🇪🇸 es / 🇸🇦 ar with full RTL) car-rental comparison site built for the **Travelpayouts affiliate program** (Rentalcars, AutoEurope, EconomyBookings).

Stack: **Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS · next-intl v4 · MDX** (`next-mdx-remote` v6) · **SQLite/libsql + Drizzle ORM**. Static-rendered (ISR) public site, Vercel-ready, no custom Node server, **no public runtime filesystem writes** (persistence goes to the database).

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000  (redirects / → /en)
```

Production build:

```bash
npm run build      # static prerender + type check
npm run start
```

Other scripts:

```bash
npm run lint                     # ESLint (Next 16 flat config — `next lint` is removed)
npm run db:seed                  # import the static MDX content into the database
npm run db:seed -- --force       # re-import everything (upsert)
npm run password:hash -- "<pw>"  # generate a bcrypt hash for ADMIN_PASSWORD_HASH
```

## Authentication (single admin)

There is **no public signup**. A single admin account is configured entirely via env vars:

| Variable | Purpose |
| --- | --- |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD_HASH` | **bcrypt hash** of the admin password (generate with `npm run password:hash -- "<password>"`) |
| `AUTH_SECRET` | Secret (32+ chars, e.g. `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`) used to sign the httpOnly session cookie |

> ⚠️ **Escaping requirement (bcrypt + dotenv-expand).** Next.js env files expand `$var` sequences, so a raw bcrypt hash (`$2b$12$…`) is silently mangled unless every `$` is escaped as `\$`. `npm run password:hash` prints the ready-to-paste escaped form. If the hash is malformed, `/api/admin/login` returns a clear 500 with instructions instead of locking you out silently.

Security features: httpOnly `SameSite=Lax` session cookie (7 days), server-side re-check of the session in every `/admin/*` API route (the proxy and the admin layout both guard pages), Origin-header/CSRF check on all mutating admin API calls, in-memory brute-force rate limiting (5 attempts / 15 min per IP).

## Admin dashboard

Everything is managed from `http://localhost:3000/admin` (in production: `/admin`):

- **Dashboard** — content counts + redirect click activity (last 30 days).
- **Articles** — full CRUD per locale/status. Body is Markdown/MDX; a `<Widget partner="…" city="…" country="…"/>` component injects the partner search widget.
- **Destinations** — full CRUD per locale (name, highlights, price, image, weight, active toggle).
- **Partners** — edit name/tagline/colors per locale, toggle **active**, and — critically — paste your **real Travelpayouts embed snippet** (HTML) into the `embed` field. Optional per-partner `marker`/`sub_id` attribution overrides.
- **Settings** — site URL, GA4 ID, default marker/sub_id, affiliate disclosure text, social links.
- **Redirects** — create cloaked `/go/<slug>` links (`https://your-domain.com/go/dubai-rentalcars` → any http(s) URL). Each link tracks clicks (total + last 30 days) for the dashboard chart.

Saving any content revalidates the affected public pages on demand (ISR stays fast).

## Cloaked redirect links — `/go/[slug]`

- `GET /go/<slug>` → **302** to the stored destination (validated http(s) at save time; `javascript:` etc. are rejected).
- Missing or inactive slugs → redirect to the homepage.
- Click counting is deferred with `after()` so the redirect is never blocked by the DB write.
- Uses the **Node.js runtime** deliberately: the libsql client supports both the local `file:` dev DB and remote Turso. (The Edge web client only speaks remote HTTP.)

## Database

The database is the **source of truth** at runtime. The static MDX files are the one-time seed source and a safe fallback when the DB is empty/unreachable (so the first `next build` stays green pre-seed).

- **Local dev (default):** zero-config SQLite file at `./data/gsirigo.db`, created on first boot (tables are bootstrapped via `CREATE TABLE IF NOT EXISTS` from `lib/db/migrations.ts`, kept in sync with `db/schema.ts`).
- **Production (Vercel):** any libsql server such as [Turso](https://turso.tech). Create a database, then set `LIBSQL_URL=libsql://<database>.turso.io?tls=1` + `LIBSQL_AUTH_TOKEN`. Once pointed at the remote DB, run `npm run db:seed` once (from your machine, with those env vars set) to import the 40 articles, 24 destinations and 12 partner entries.
- `DATABASE_URL` is accepted as an alias for `LIBSQL_URL` (set either, not both).

Schema (see `db/schema.ts`): `articles (slug, locale)` · `destinations (slug, locale)` · `partners (id, locale)` · `site_settings (key)` · `redirect_links (slug)` · `redirect_clicks (id)`. `drizzle.config.ts` is a convenience for `drizzle-kit`; runtime migrations are the idempotent bootstraps above.

## Environment variables

Copy `.env.example` → `.env.local` for local development (`.env*.local` is gitignored and never committed).

| Variable | Purpose | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for `sitemap.xml`, `robots.txt`, hreflang, admin CSRF origin | **yes** (prod) |
| `ADMIN_EMAIL` | Admin login email | **yes** (prod) |
| `ADMIN_PASSWORD_HASH` | Escaped bcrypt hash of the admin password (see note above) | **yes** (prod) |
| `AUTH_SECRET` | Session-cookie signing secret (32+ chars) | **yes** (prod) |
| `LIBSQL_URL` / `DATABASE_URL` | Remote libsql/Turso URL; local `file:` DB used when unset | **yes** (prod) |
| `LIBSQL_AUTH_TOKEN` | Turso auth token (only needed for remote DBs) | prod (Turso) |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID — analytics stays disabled when empty | optional |
| `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` | Default attribution marker for draft widget links | optional |
| `NEXT_PUBLIC_TRAVELPAYOUTS_SUB_ID` | Default `sub_id` for draft widget links | optional |

## Travelpayouts integration (REQUIRED before launch)

The site ships with a **draft search widget** (a client-side form that links out via `getAffiliateLink()` in [`lib/partners.ts`](lib/partners.ts)). It must be replaced with your **real Travelpayouts embed snippets**:

1. Log in to the [Travelpayouts dashboard](https://www.travelpayouts.com/) and open **Tools → Widgets** for the car rental program(s) (Rentalcars.com, AutoEurope, EconomyBookings).
2. Generate a widget for each partner/locale combination you want, e.g. Rentalcars **/en**, Rentalcars /ar, AutoEurope /fr, AutoEurope /es.
3. In the **admin dashboard → Partners** (per locale), paste each real embed snippet into the `embed` field and toggle the partner **active**.
4. For the partner search-form link (used when `embed` is empty), set your real `marker`/`sub_id` per partner in the admin, or globally via `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` / `NEXT_PUBLIC_TRAVELPAYOUTS_SUB_ID`.

> ⚠️ The exact iframe/embed markup must come from your dashboard — do not hand-craft it. The `embed` slot is rendered verbatim by [`components/car-rental-widget.tsx`](components/car-rental-widget.tsx) when set.

### How the widget is used

- Homepage hero embed (partner `rentalcars`).
- Destination cards + destination pages (pre-filled pickup city/country).
- Inside articles via an MDX `<Widget partner="..." city="..." country="..." />` component (see [`components/mdx-components.tsx`](components/mdx-components.tsx)).
- "Compare prices now" CTA blocks.

## Content pipeline (MDX → database)

The `content/{en,fr,es,ar}/` MDX files (10 articles per locale, 3 legal pages) are the **seed source**:

```
content/{en,fr,es,ar}/
  articles/*.mdx        # 10 articles per locale (40 total)
  legal/*.mdx           # affiliate-disclosure, privacy-policy, terms
```

Article frontmatter:

```yaml
title, excerpt, metaTitle, metaDescription, image, date, readingTime
destination: ""        # optional related destination slug
widget: { partner, city, country }   # optional pre-filled embed
```

`npm run db:seed` imports them once (skip-if-not-empty; `--force` re-imports). After that, edits happen in the admin and the site renders from the DB. Public pages read DB-first with the MDX/static data as fallback, then revalidate on admin saves.

Images are Picsum placeholders (`picsum.photos/seed/...`) — replace with your own photography before launch (`next/image` `remotePatterns` in `next.config.ts` already allow Unsplash).

## SEO

- Locale-prefixed routes `/en` `/fr` `/es` `/ar`; `/` redirects to `en`.
- Hreflang (4 locales + `x-default`) and canonical URLs on every page via [`lib/metadata.ts`](lib/metadata.ts).
- Per-locale entries in `sitemap.xml` and `robots.txt` (server-rendered, DB-driven slugs, uses `NEXT_PUBLIC_SITE_URL`); `/admin` and `/go` are excluded from indexing.
- JSON-LD: `Organization` on the homepage, `Article` on every article page ([`components/json-ld.tsx`](components/json-ld.tsx)).
- Arabic is fully RTL (`dir="rtl"`, Noto Sans Arabic font).

## Deployment (Vercel)

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** the repo. Framework preset **Next.js** is auto-detected — no build overrides needed (`npm run build` / `npm start` are standard).
3. Create a [Turso](https://turso.tech) database and note `LIBSQL_URL` + `LIBSQL_AUTH_TOKEN`.
4. Add these environment variables in the Vercel project dashboard (both Preview and Production if you want the admin to work on previews):
   - `NEXT_PUBLIC_SITE_URL` → `https://gsirigo.com` (or your Vercel URL)
   - `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER`, `NEXT_PUBLIC_TRAVELPAYOUTS_SUB_ID` (optional)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (escaped bcrypt form), `AUTH_SECRET`
   - `LIBSQL_URL` + `LIBSQL_AUTH_TOKEN` (or `DATABASE_URL`)
5. Deploy, then run once from your machine (with the same `LIBSQL_URL`/`LIBSQL_AUTH_TOKEN`): `npm run db:seed`.
6. Log in at `/admin` and paste your real Travelpayouts embeds into **Partners**, then set your GA/settings.

### Deployment checks after first deploy

- `GET /` returns 307 → `/en`.
- `GET /sitemap.xml` lists DB slugs; `GET /robots.txt` disallows `/admin` and `/go` and points to the sitemap.
- `/ar/*` pages render with `dir="rtl"` and `lang="ar"`.
- Each article page contains `application/ld+json` with `"@type":"Article"`.
- Widgets render your real Travelpayouts embeds (post-integration).
- `/admin` redirects to `/admin/login` when logged out; logging in with the configured email + password shows the dashboard.

## Project structure (highlights)

```
app/
  [locale]/                    # root layout renders <html lang dir> + chrome
    page.tsx                   # homepage (DB-driven hero/feeds)
    articles/ + [slug]/        # article list + MDX detail (DB-first)
    destinations/ + [slug]/    # destination guides + pre-filled widgets
    about, contact             # info + form
    legal/[slug]               # legal MDX
    not-found.tsx              # localized 404
  admin/login/                 # public login page (own layout)
  admin/(dashboard)/           # guarded admin shell + pages (articles, destinations,
                               # partners, redirects, settings, dashboard)
  api/admin/                   # session-guarded CRUD + login/logout routes
  go/[slug]/                   # cloaked redirects + click tracking (Node runtime)
  global-not-found.tsx         # app-wide 404 (unmatched routes)
  proxy.ts                     # Next 16 proxy: next-intl + admin session guard
  sitemap.ts, robots.ts        # DB-driven, /admin + /go excluded
db/schema.ts                   # Drizzle schema (6 tables)
lib/
  auth/                        # password (bcrypt), session (jose), rate-limit, require-admin
  db/                          # libsql client, runtime migrations, repositories
  content, destinations, partners, metadata, site, revalidate
components/                    # header/footer, widget (+widget-host), cards, MDX, admin UI
content/                       # MDX seed source (imported by npm run db:seed)
```

## Notes

- `experimental.globalNotFound` is enabled in `next.config.ts` for the app-wide 404 (required by the multi-root-layout setup with a top-level `[locale]` segment).
- The admin API uses Node-runtime route handlers; the public site stays ISR/SSG. On-demand revalidation uses `revalidatePath` + `revalidateTag(tag, 'max')` (Next 16 requires the second cache-profile argument).
- GA is loaded only when `NEXT_PUBLIC_GA_ID` is set (see [`components/analytics.tsx`](components/analytics.tsx)).
- The affiliate disclosure is shown in the header, footer and legal pages for compliance.