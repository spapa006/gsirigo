# Gsirigo — Travelpayouts Car Rental Affiliate Site

Multilingual (🇬🇧 en / 🇫🇷 fr / 🇪🇸 es / 🇸🇦 ar with full RTL) car-rental comparison site built for the **Travelpayouts affiliate program** (Rentalcars, AutoEurope, EconomyBookings).

Stack: **Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS · next-intl v4 · MDX** (`next-mdx-remote` v6). Static-rendered, Vercel-ready, no custom Node server.

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

The production build prerenders **101 pages** (4 locales × home, articles ×10, destinations ×6, about, contact, legal ×3).

## Environment variables

Copy `.env.example` → `.env.local` (only needed for local testing; Vercel env vars below):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used by `sitemap.xml`, `robots.txt` and hreflang tags |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID — analytics **stays disabled** when empty |
| `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` | Attribution marker appended to draft affiliate links |
| `NEXT_PUBLIC_TRAVELPAYOUTS_SUB_ID` | `sub_id` appended to draft affiliate links |

## Travelpayouts integration (REQUIRED before launch)

The site ships with a **draft search widget** (a client-side form that links out via `getAffiliateLink()` in [`lib/partners.ts`](lib/partners.ts)). It must be replaced with your **real Travelpayouts embed snippets**:

1. Log in to the [Travelpayouts dashboard](https://www.travelpayouts.com/) and open **Tools → Widgets** for the car rental program(s) (Rentalcars.com, AutoEurope, EconomyBookings).
2. Generate a widget for each partner/locale combination you want, e.g. Rentalcars **/en**, Rentalcars /ar, AutoEurope /fr, AutoEurope /es.
3. Paste each real embed snippet into the `embed` field of the corresponding partner entry in [`lib/partners.ts`](lib/partners.ts).
4. For the partner search-form link (used when `embed` is empty), make sure the destination URL in [`lib/partners.ts`](lib/partners.ts) contains your real `subid`/marker, or pass it via `NEXT_PUBLIC_TRAVELPAYOUTS_SUB_ID`.

> ⚠️ The exact iframe/embed markup must come from your dashboard — do not hand-craft it. The `embed` slot is rendered verbatim by [`components/car-rental-widget.tsx`](components/car-rental-widget.tsx) when set.

### How the widget is used

- Homepage hero embed (partner `rentalcars`).
- Destination cards + destination pages (pre-filled pickup city/country).
- Inside articles via an MDX `<Widget partner="..." city="..." country="..." />` component (see [`components/mdx-components.tsx`](components/mdx-components.tsx)).
- "Compare prices now" CTA blocks.

## Content

Articles and legal pages are MDX with frontmatter, one file per locale:

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

Images are Picsum placeholders (`picsum.photos/seed/...`) — replace with your own photography before launch (`next/image` `remotePatterns` in `next.config.ts` already allow Unsplash).

## SEO

- Locale-prefixed routes `/en` `/fr` `/es` `/ar`; `/` redirects to `en`.
- Hreflang (4 locales + `x-default`) and canonical URLs on every page via [`lib/metadata.ts`](lib/metadata.ts).
- Per-locale entries in `sitemap.xml` and `robots.txt` (Server-rendered, driven by `NEXT_PUBLIC_SITE_URL`).
- JSON-LD: `Organization` on the homepage, `Article` on every article page ([`components/json-ld.tsx`](components/json-ld.tsx)).
- Arabic is fully RTL (`dir="rtl"`, Noto Sans Arabic font).

## Deployment (Vercel)

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import** the repo. Framework preset **Next.js** is auto-detected — no build overrides needed.
3. Add environment variables:

   - `NEXT_PUBLIC_SITE_URL` → your production domain (`https://gsirigo.com` or your Vercel URL)
   - `NEXT_PUBLIC_GA_ID` → your GA4 measurement ID
   - `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER` / `NEXT_PUBLIC_TRAVELPAYOUTS_SUB_ID` → your attribution values

4. Deploy. `next build` runs automatically (Turbopack); all pages prerender statically.

### Deployment checks after first deploy

- `GET /` returns 307 → `/en`.
- `GET /sitemap.xml` returns ~108 URLs across 4 locales; `GET /robots.txt` points to the sitemap.
- `/ar/*` pages render with `dir="rtl"` and `lang="ar"`.
- Each article page contains `application/ld+json` with `"@type":"Article"`.
- Widgets render your real Travelpayouts embeds (post-integration).

## Project structure (highlights)

```
app/
  [locale]/                    # root layout renders <html lang dir> + chrome
    page.tsx                   # homepage
    articles/ + [slug]/        # article list + MDX detail
    destinations/ + [slug]/    # destination guides + pre-filled widgets
    about, contact             # info + form
    legal/[slug]               # legal MDX
    not-found.tsx              # localized 404
  global-not-found.tsx         # app-wide 404 (unmatched routes)
  proxy.ts                     # next-intl locale middleware (Next 16 proxy)
  sitemap.ts, robots.ts, icon.svg
i18n/                          # routing, navigation, request config (next/root-params)
lib/                           # content, destinations, partners, metadata, site
components/                    # header/footer, widget, cards, MDX components, ui
messages/{en,fr,es,ar}.json    # UI strings
content/                       # MDX articles + legal pages
```

## Notes

- `experimental.globalNotFound` is enabled in `next.config.ts` for the app-wide 404 (required by the multi-root-layout setup with a top-level `[locale]` segment).
- GA is loaded only when `NEXT_PUBLIC_GA_ID` is set (see [`components/analytics.tsx`](components/analytics.tsx)).
- The affiliate disclosure is shown in the header, footer and legal pages for compliance.