import { NextResponse } from 'next/server';
import type { ClickEvent } from '@/lib/analytics/click-event';
import { recordClick } from '@/lib/db/repositories/redirects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Internal tracking endpoint — the deterministic write path for /go clicks.
 *
 * /go captures the ClickEvent (server-side header parsing + IP hashing, so
 * raw IPs never leave the /go lambda or reach this route) and POSTs it here
 * as a fire-and-forget keepalive request. The write is AWAITED here — a
 * normal request handler — which is what makes capture reliable (verified:
 * awaited lambda writes land 100%, `after()` background writes were flaky on
 * Vercel for 302 responses).
 *
 * Security: in production, requests must carry x-track-secret matching
 * TRACKING_SECRET. Without that env var the endpoint accepts POSTs (dev /
 * self-host) — set TRACKING_SECRET in Vercel to lock it down.
 */
const MAX_SLUG = 100;
const MAX_UA = 512;
const MAX_REFERRER = 512;

function boundedText(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.length > 0 && value.length <= max
    ? value
    : null;
}

/** Defensive re-validation so a malformed payload never reaches the DB. */
function sanitizeEvent(raw: unknown): ClickEvent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const e = raw as Record<string, unknown>;
  if (typeof e.isBot !== 'boolean') return null;
  const deviceType =
    e.deviceType === 'mobile' || e.deviceType === 'desktop' || e.deviceType === 'tablet'
      ? e.deviceType
      : null;
  return {
    ipHash: boundedText(e.ipHash, 64),
    country: boundedText(e.country, 8),
    city: boundedText(e.city, 128),
    deviceType,
    browser: boundedText(e.browser, 128),
    os: boundedText(e.os, 128),
    referrer: boundedText(e.referrer, MAX_REFERRER),
    locale: boundedText(e.locale, 8),
    isBot: e.isBot,
    userAgent: boundedText(e.userAgent, MAX_UA),
  };
}

export async function POST(request: Request) {
  const secret = process.env.TRACKING_SECRET?.trim();
  const requiresSecret = process.env.NODE_ENV === 'production' && !!secret;
  if (requiresSecret && request.headers.get('x-track-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }
  if (typeof payload !== 'object' || payload === null) {
    return NextResponse.json({ ok: false, error: 'bad payload' }, { status: 400 });
  }

  const { slug, event, eventId } = payload as {
    slug?: unknown;
    event?: unknown;
    eventId?: unknown;
  };
  if (typeof slug !== 'string' || slug.length === 0 || slug.length > MAX_SLUG) {
    return NextResponse.json({ ok: false, error: 'bad slug' }, { status: 400 });
  }
  const clean = sanitizeEvent(event);
  if (!clean) {
    return NextResponse.json({ ok: false, error: 'bad event' }, { status: 400 });
  }
  // UUIDs are 36 chars; generous bound that still rejects junk payloads.
  const cleanEventId =
    typeof eventId === 'string' && eventId.length > 0 && eventId.length <= 64
      ? eventId
      : undefined;

  // Awaited, deterministic write. recordClick logs on failure and never throws.
  // With an eventId, duplicates (both /go delivery paths racing) are ignored
  // by ON CONFLICT DO NOTHING — at-most-once semantics.
  await recordClick(slug, clean, cleanEventId);

  return NextResponse.json({ ok: true });
}