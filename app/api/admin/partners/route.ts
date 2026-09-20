import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { savePartner } from '@/lib/db/repositories/partners';
import type { PartnerId } from '@/lib/partners';
import { revalidateSiteWide } from '@/lib/revalidate';

export const runtime = 'nodejs';

const PARTNER_IDS: PartnerId[] = ['rentalcars', 'autoeurope', 'economybookings'];

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const id = String(body.id ?? '').trim();
  const locale = String(body.locale ?? '').trim();

  if (!PARTNER_IDS.includes(id as PartnerId)) {
    return NextResponse.json({ error: 'Unknown partner id.' }, { status: 400 });
  }
  if (!['en', 'fr', 'es', 'ar'].includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale.' }, { status: 400 });
  }

  await savePartner({
    id: id as PartnerId,
    locale,
    name: String(body.name ?? ''),
    shortName: String(body.shortName ?? ''),
    tagline: String(body.tagline ?? ''),
    baseUrl: String(body.baseUrl ?? ''),
    color: String(body.color ?? '#1d4ed8'),
    commissionNote: String(body.commissionNote ?? ''),
    embed: String(body.embed ?? ''),
    active: body.active !== false,
    marker: body.marker ? String(body.marker) : undefined,
    subId: body.subId ? String(body.subId) : undefined,
  });

  revalidateSiteWide();
  return NextResponse.json({ ok: true, id, locale });
}