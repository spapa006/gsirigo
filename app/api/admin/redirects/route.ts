import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { saveRedirect } from '@/lib/db/repositories/redirects';

export const runtime = 'nodejs';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

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
  const destinationUrl = String(body.destinationUrl ?? '').trim();

  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: 'Slug must be lowercase letters/numbers with dashes (e.g. dubai-rentalcars).' },
      { status: 400 }
    );
  }
  if (!isSafeHttpUrl(destinationUrl)) {
    return NextResponse.json(
      { error: 'Destination must be a valid http(s):// URL.' },
      { status: 400 }
    );
  }

  await saveRedirect({
    slug,
    destinationUrl,
    partner: body.partner ? String(body.partner).trim() : null,
    label: String(body.label ?? ''),
    isActive: body.isActive !== false,
  });

  return NextResponse.json({ ok: true, slug });
}