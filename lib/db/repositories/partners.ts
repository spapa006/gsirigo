import { and, eq } from 'drizzle-orm';
import { partners, type PartnerRow } from '@/db/schema';
import { getDb, withDb } from '@/lib/db/client';
import type { PartnerId, PartnerConfig } from '@/lib/partners';
import { PARTNERS } from '@/lib/partners';

/** Partner config as the public site consumes it (embed from DB). */
export type ManagedPartner = PartnerConfig & {
  active: boolean;
  marker?: string | null;
  subId?: string | null;
};

export const PARTNER_IDS: PartnerId[] = ['rentalcars', 'autoeurope', 'economybookings'];

function rowToManaged(row: PartnerRow): ManagedPartner {
  const staticCfg = PARTNERS[row.id as PartnerId];
  return {
    ...staticCfg,
    id: row.id as PartnerId,
    name: row.name || staticCfg?.name || row.id,
    shortName: row.shortName || staticCfg?.shortName || row.id,
    tagline: row.tagline || staticCfg?.tagline || '',
    baseUrl: row.baseUrl || staticCfg?.baseUrl || '',
    color: row.color || staticCfg?.color || '#1d4ed8',
    commissionNote: row.commissionNote || staticCfg?.commissionNote || '',
    embed: row.embed || '',
    active: row.active,
    marker: row.marker,
    subId: row.subId,
  };
}

/** Partners for a locale. Falls back to static config when the DB is empty. */
export async function getActivePartners(locale: string): Promise<ManagedPartner[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(partners)
      .where(eq(partners.locale, locale));
    if (rows.length > 0) {
      return rows.filter((r) => r.active).map(rowToManaged);
    }
  } catch {
    // fall through
  }
  return PARTNER_IDS.map((id) => ({
    ...PARTNERS[id],
    active: true,
    marker: null,
    subId: null,
  }));
}

export async function getPartner(
  id: PartnerId,
  locale: string
): Promise<ManagedPartner | null> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(partners)
      .where(and(eq(partners.id, id), eq(partners.locale, locale)))
      .limit(1);
    const row = rows[0];
    if (row) return rowToManaged(row);
  } catch {
    // fall through
  }
  const staticCfg = PARTNERS[id];
  return staticCfg ? { ...staticCfg, active: true, marker: null, subId: null } : null;
}

export type PartnerSaveInput = {
  id: PartnerId;
  locale: string;
  name: string;
  shortName: string;
  tagline: string;
  baseUrl: string;
  color: string;
  commissionNote: string;
  embed: string;
  active: boolean;
  marker?: string;
  subId?: string;
};

export async function savePartner(input: PartnerSaveInput): Promise<void> {
  await withDb(async (db) => {
    await db
      .insert(partners)
      .values({
        id: input.id,
        locale: input.locale,
        name: input.name,
        shortName: input.shortName,
        tagline: input.tagline,
        baseUrl: input.baseUrl,
        color: input.color,
        commissionNote: input.commissionNote,
        embed: input.embed,
        active: input.active,
        marker: input.marker?.trim() || null,
        subId: input.subId?.trim() || null,
      })
      .onConflictDoUpdate({
        target: [partners.id, partners.locale],
        set: {
          name: input.name,
          shortName: input.shortName,
          tagline: input.tagline,
          baseUrl: input.baseUrl,
          color: input.color,
          commissionNote: input.commissionNote,
          embed: input.embed,
          active: input.active,
          marker: input.marker?.trim() || null,
          subId: input.subId?.trim() || null,
        },
      });
  });
}

/** Admin: all partner rows across locales. */
export async function listAllPartnerRows(): Promise<PartnerRow[]> {
  try {
    const db = getDb();
    return await db.select().from(partners);
  } catch {
    return [];
  }
}

export async function getPartnerRow(
  id: string,
  locale: string
): Promise<PartnerRow | null> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(partners)
      .where(and(eq(partners.id, id), eq(partners.locale, locale)))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function deletePartner(id: string, locale: string): Promise<void> {
  await withDb(async (db) => {
    await db
      .delete(partners)
      .where(and(eq(partners.id, id), eq(partners.locale, locale)));
  });
}

export async function countPartners(): Promise<number> {
  try {
    const db = getDb();
    const rows = await db.select({ id: partners.id }).from(partners);
    return new Set(rows.map((r) => r.id)).size;
  } catch {
    return PARTNER_IDS.length;
  }
}