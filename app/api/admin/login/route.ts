import { NextResponse } from 'next/server';
import { verifyPassword, verifyHashShape } from '@/lib/auth/password';
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limit';
import { createSessionCookie } from '@/lib/auth/session';

export const runtime = 'nodejs';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const remaining = checkRateLimit(`login:${ip}`);
  if (remaining <= 0) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  const adminEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  // Surface a misconfigured hash clearly instead of silently failing auth.
  const malformed = verifyHashShape(adminHash);
  if (malformed) {
    return NextResponse.json({ error: malformed }, { status: 500 });
  }

  const ok =
    email !== '' &&
    email === adminEmail &&
    (await verifyPassword(password, adminHash));

  if (!ok) {
    // Constant-ish failure cost: small jittered delay before responding.
    await sleep(300 + Math.random() * 400);
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  resetRateLimit(`login:${ip}`);
  try {
    await createSessionCookie();
  } catch (error) {
    // AUTH_SECRET missing is a config error — surface it.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Session setup failed.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}