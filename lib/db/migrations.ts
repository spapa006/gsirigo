/**
 * Bootstrap SQL for the Gsirigo SQLite (libsql) database.
 *
 * These `CREATE TABLE IF NOT EXISTS` statements mirror db/schema.ts. Drizzle
 * is used for all reads/writes at runtime; this file only guarantees the
 * tables exist on first boot (local `file:` dev DB or remote Turso DB).
 *
 * ⚠️ Keep in sync with db/schema.ts when adding columns/tables.
 */

export const MIGRATION_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS articles (
    slug TEXT NOT NULL,
    locale TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published',
    title TEXT NOT NULL DEFAULT '',
    excerpt TEXT NOT NULL DEFAULT '',
    meta_title TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '',
    reading_time TEXT NOT NULL DEFAULT '',
    destination TEXT,
    widget_partner TEXT,
    widget_city TEXT,
    widget_country TEXT,
    body TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (slug, locale)
  )`,

  `CREATE TABLE IF NOT EXISTS destinations (
    slug TEXT NOT NULL,
    locale TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    tagline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    highlights TEXT NOT NULL DEFAULT '[]',
    price_from TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    weight INTEGER NOT NULL DEFAULT 99,
    active INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (slug, locale)
  )`,

  `CREATE TABLE IF NOT EXISTS partners (
    id TEXT NOT NULL,
    locale TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    short_name TEXT NOT NULL DEFAULT '',
    tagline TEXT NOT NULL DEFAULT '',
    base_url TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#1d4ed8',
    commission_note TEXT NOT NULL DEFAULT '',
    embed TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    marker TEXT,
    sub_id TEXT,
    PRIMARY KEY (id, locale)
  )`,

  `CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (key)
  )`,

  `CREATE TABLE IF NOT EXISTS redirect_links (
    slug TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    partner TEXT,
    label TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    click_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (slug)
  )`,

  `CREATE TABLE IF NOT EXISTS redirect_clicks (
    id TEXT NOT NULL,
    slug TEXT NOT NULL,
    clicked_at INTEGER NOT NULL,
    PRIMARY KEY (id)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_redirect_clicks_slug ON redirect_clicks (slug, clicked_at)`,
  `CREATE INDEX IF NOT EXISTS idx_articles_locale_status ON articles (locale, status)`,
];