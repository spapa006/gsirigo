import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { deletePartner, savePartner } from '@/lib/db/repositories/partners';
import type { PartnerId } from '@/lib/partners';
import { revalidateSiteWide } from '@/lib/revalidate';
import { serverErrorResponse } from '@/lib/api/error-response';

export const runtime = 'nodejs';
// Cold-start + remote Turso handshake can exceed the 10s Hobby default on the
// first write; raise the cap so writes don't end up as opaque 504s.
export const maxDuration = 60;

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

  try {
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
  } catch (error) {
    return serverErrorResponse(error);
  }

  revalidateSiteWide();
  return NextResponse.json({ ok: true, id, locale });
}

const LOCALES = ['en', 'fr', 'es', 'ar'];

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const id = url.searchParams.get('id') ?? '';
  const locale = url.searchParams.get('locale') ?? '';

  if (!PARTNER_IDS.includes(id as PartnerId)) {
    return NextResponse.json({ error: 'Unknown partner id.' }, { status: 400 });
  }
  if (!LOCALES.includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale.' }, { status: 400 });
  }

  try {
    await deletePartner(id as PartnerId, locale);
  } catch (error) {
    return serverErrorResponse(error);
  }
  revalidateSiteWide();
  return NextResponse.json({ ok: true });
}