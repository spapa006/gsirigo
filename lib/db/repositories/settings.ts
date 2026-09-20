import { siteSettings, type SiteSettingRow } from '@/db/schema';
import { getDb, withDb } from '@/lib/db/client';

export type SiteSettings = {
  siteUrl: string;
  gaId: string;
  defaultMarker: string;
  defaultSubId: string;
  /** Affiliate disclosure text shown in the footer / legal pages */
  affiliateDisclosure: string;
  socialX: string;
  socialInstagram: string;
  socialFacebook: string;
};

export const SETTING_KEYS = [
  'site_url',
  'ga_id',
  'default_marker',
  'default_sub_id',
  'affiliate_disclosure',
  'social_x',
  'social_instagram',
  'social_facebook',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

const DEFAULTS: Record<SettingKey, string> = {
  site_url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gsirigo.com',
  ga_id: process.env.NEXT_PUBLIC_GA_ID ?? '',
  default_marker: process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER ?? '',
  default_sub_id: process.env.NEXT_PUBLIC_TRAVELPAYOUTS_SUB_ID ?? '',
  affiliate_disclosure: '',
  social_x: 'https://x.com/gsirigo',
  social_instagram: 'https://instagram.com/gsirigo',
  social_facebook: 'https://facebook.com/gsirigo',
};

/**
 * Current effective settings: DB overrides env/static defaults. Falls back to
 * defaults when the DB is empty or unreachable (fresh build pre-seed).
 */
export async function getSettings(): Promise<SiteSettings> {
  const values: Partial<Record<SettingKey, string>> = {};
  try {
    const db = getDb();
    const rows = await db.select().from(siteSettings);
    for (const row of rows) {
      values[row.key as SettingKey] = row.value;
    }
  } catch {
    // fall through to defaults
  }
  return {
    siteUrl: values.site_url ?? DEFAULTS.site_url,
    gaId: values.ga_id ?? DEFAULTS.ga_id,
    defaultMarker: values.default_marker ?? DEFAULTS.default_marker,
    defaultSubId: values.default_sub_id ?? DEFAULTS.default_sub_id,
    affiliateDisclosure:
      values.affiliate_disclosure ?? DEFAULTS.affiliate_disclosure,
    socialX: values.social_x ?? DEFAULTS.social_x,
    socialInstagram: values.social_instagram ?? DEFAULTS.social_instagram,
    socialFacebook: values.social_facebook ?? DEFAULTS.social_facebook,
  };
}

export async function saveSetting(key: SettingKey, value: string): Promise<void> {
  await withDb(async (db) => {
    await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      });
  });
}

export async function saveSettings(entries: Partial<Record<SettingKey, string>>): Promise<void> {
  await withDb(async (db) => {
    const now = new Date();
    for (const [key, value] of Object.entries(entries)) {
      if (typeof value !== 'string') continue;
      await db
        .insert(siteSettings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value, updatedAt: now },
        });
    }
  });
}

/** Admin display list. */
export async function listSettingRows(): Promise<SiteSettingRow[]> {
  try {
    const db = getDb();
    return await db.select().from(siteSettings);
  } catch {
    return [];
  }
}