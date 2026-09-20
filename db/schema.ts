import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/* ------------------------------- Articles -------------------------------- */
// PK = (slug, locale): an article exists once per locale (DDL in
// lib/db/migrations.ts, kept in sync manually).

export const articles = sqliteTable('articles', {
  slug: text('slug').notNull(),
  locale: text('locale').notNull(), // en | fr | es | ar
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('published'),
  title: text('title').notNull().default(''),
  excerpt: text('excerpt').notNull().default(''),
  metaTitle: text('meta_title').notNull().default(''),
  metaDescription: text('meta_description').notNull().default(''),
  image: text('image').notNull().default(''),
  date: text('date').notNull().default(''),
  readingTime: text('reading_time').notNull().default(''),
  destination: text('destination'),
  widgetPartner: text('widget_partner'),
  widgetCity: text('widget_city'),
  widgetCountry: text('widget_country'),
  /** Raw MDX body (source of truth for article content) */
  body: text('body').notNull().default(''),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/* ------------------------------ Destinations ----------------------------- */
// PK = (slug, locale)

export const destinations = sqliteTable('destinations', {
  slug: text('slug').notNull(),
  locale: text('locale').notNull(),
  name: text('name').notNull().default(''),
  country: text('country').notNull().default(''),
  city: text('city').notNull().default(''),
  tagline: text('tagline').notNull().default(''),
  description: text('description').notNull().default(''),
  /** JSON string[] — e.g. ["Airport pick-up in minutes", "..."] */
  highlights: text('highlights').notNull().default('[]'),
  priceFrom: text('price_from').notNull().default(''),
  image: text('image').notNull().default(''),
  weight: integer('weight').notNull().default(99),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

/* -------------------------------- Partners ------------------------------- */
// PK = (id, locale)

export const partners = sqliteTable('partners', {
  id: text('id').notNull(), // rentalcars | autoeurope | economybookings
  locale: text('locale').notNull(),
  name: text('name').notNull().default(''),
  shortName: text('short_name').notNull().default(''),
  tagline: text('tagline').notNull().default(''),
  baseUrl: text('base_url').notNull().default(''),
  color: text('color').notNull().default('#1d4ed8'),
  commissionNote: text('commission_note').notNull().default(''),
  /** Real Travelpayouts widget snippet (HTML) for this partner + locale */
  embed: text('embed').notNull().default(''),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  /** Optional per-partner Travelpayouts attribution override */
  marker: text('marker'),
  subId: text('sub_id'),
});

/* ------------------------------ Site settings ----------------------------- */
// key = 'site_url' | 'ga_id' | 'default_marker' | 'default_sub_id'
//      | 'affiliate_disclosure' | 'social_x' | 'social_instagram' | 'social_facebook'

export const siteSettings = sqliteTable('site_settings', {
  key: text('key').notNull(),
  value: text('value').notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/* ----------------------------- Redirect links ----------------------------- */
// PK = slug (DDL in lib/db/migrations.ts)

export const redirectLinks = sqliteTable('redirect_links', {
  slug: text('slug').notNull(),
  /** Full destination URL (must start with http:// or https://) */
  destinationUrl: text('destination_url').notNull(),
  /** Optional partner id this link belongs to */
  partner: text('partner'),
  /** Internal note — never shown publicly */
  label: text('label').notNull().default(''),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  clickCount: integer('click_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/** One row per click, used for the "clicks last 30 days" dashboard chart. */
export const redirectClicks = sqliteTable('redirect_clicks', {
  id: text('id').notNull(), // uuid
  slug: text('slug').notNull(),
  clickedAt: integer('clicked_at', { mode: 'timestamp' }).notNull(),
});

/* --------------------------------- Types ---------------------------------- */

export type ArticleRow = typeof articles.$inferSelect;
export type NewArticleRow = typeof articles.$inferInsert;
export type DestinationRow = typeof destinations.$inferSelect;
export type NewDestinationRow = typeof destinations.$inferInsert;
export type PartnerRow = typeof partners.$inferSelect;
export type NewPartnerRow = typeof partners.$inferInsert;
export type SiteSettingRow = typeof siteSettings.$inferSelect;
export type RedirectLinkRow = typeof redirectLinks.$inferSelect;
export type NewRedirectLinkRow = typeof redirectLinks.$inferInsert;