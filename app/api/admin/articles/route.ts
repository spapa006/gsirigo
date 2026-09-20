import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { deleteArticle, saveArticle, LOCALES } from '@/lib/db/repositories/articles';
import { revalidateArticle } from '@/lib/revalidate';

export const runtime = 'nodejs';

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
  const status = body.status === 'draft' ? 'draft' : 'published';

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: 'Slug must be lowercase letters/numbers with dashes (e.g. dubai-car-rental).' },
      { status: 400 }
    );
  }
  if (!LOCALES.includes(locale as (typeof LOCALES)[number])) {
    return NextResponse.json({ error: 'Invalid locale.' }, { status: 400 });
  }
  if (typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }
  if (typeof body.body !== 'string') {
    return NextResponse.json({ error: 'Body is required.' }, { status: 400 });
  }

  await saveArticle({
    slug,
    locale,
    status,
    title: String(body.title),
    excerpt: String(body.excerpt ?? ''),
    metaTitle: String(body.metaTitle ?? ''),
    metaDescription: String(body.metaDescription ?? ''),
    image: String(body.image ?? ''),
    date: String(body.date ?? new Date().toISOString().slice(0, 10)),
    readingTime: String(body.readingTime ?? ''),
    destination: body.destination ? String(body.destination) : undefined,
    widgetPartner: body.widgetPartner ? String(body.widgetPartner) : undefined,
    widgetCity: body.widgetCity ? String(body.widgetCity) : undefined,
    widgetCountry: body.widgetCountry ? String(body.widgetCountry) : undefined,
    body: String(body.body),
  });

  revalidateArticle(locale, slug);
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

  await deleteArticle(slug, locale);
  revalidateArticle(locale, slug);
  return NextResponse.json({ ok: true });
}