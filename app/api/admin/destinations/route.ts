import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  deleteDestination,
  saveDestination,
} from '@/lib/db/repositories/destinations';
import { revalidateDestination } from '@/lib/revalidate';
import { serverErrorResponse } from '@/lib/api/error-response';

export const runtime = 'nodejs';
// Cold-start + remote Turso handshake can exceed the 10s Hobby default on the
// first write; raise the cap so writes don't end up as opaque 504s.
export const maxDuration = 60;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const slug = String(body.slug ?? '').trim();
  const locale = String(body.locale ?? '').trim();
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: 'Slug must be lowercase letters/numbers with dashes.' },
      { status: 400 }
    );
  }
  if (!['en', 'fr', 'es', 'ar'].includes(locale)) {
    return NextResponse.json({ error: 'Invalid locale.' }, { status: 400 });
  }
  if (typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const highlights = Array.isArray(body.highlights)
    ? body.highlights.map(String)
    : [];

  try {
    await saveDestination({
      slug,
      locale,
      name: String(body.name ?? ''),
      country: String(body.country ?? ''),
      city: String(body.city ?? ''),
      tagline: String(body.tagline ?? ''),
      description: String(body.description ?? ''),
      highlights,
      priceFrom: String(body.priceFrom ?? ''),
      image: String(body.image ?? ''),
      weight: Number.isFinite(Number(body.weight)) ? Number(body.weight) : 99,
      active: body.active !== false,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }

  revalidateDestination(locale, slug);
  return NextResponse.json({ ok: true, slug, locale });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') ?? '';
  const locale = url.searchParams.get('locale') ?? '';
  if (!slug || !locale) {
    return NextResponse.json({ error: 'slug and locale are required.' }, { status: 400 });
  }

  try {
    await deleteDestination(slug, locale);
  } catch (error) {
    return serverErrorResponse(error);
  }
  revalidateDestination(locale, slug);
  return NextResponse.json({ ok: true });
}