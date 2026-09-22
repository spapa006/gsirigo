import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getRedirectLink } from '@/lib/db/repositories/redirects';
import { buildClickEvent } from '@/lib/analytics/click-event';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Why Node runtime instead of Edge?
// The admin redirect feature must work against BOTH the local `file:` dev DB
// and a remote Turso DB in production. The libsql Node client supports both;
// the Edge web client only speaks remote HTTP. Redirects are still fast —
// a single indexed PK lookup — and click tracking is deliberately deferred
// so the 302 is never blocked. To switch to Edge, use
// `@libsql/client/web` in lib/db/client.ts and set runtime = 'edge' (remote
// LIBSQL_URL required).

/**
 * Public cloaked affiliate link: /go/dubai-rentalcars
 *
 * - Found + active  → capture a full click event (geo, device, referrer,
 *                     locale, bot flag), dispatch it to /api/track as a
 *                     fire-and-forget keepalive request, then 302 (the 302 is
 *                     never blocked by the DB write)
 * - Missing/inactive → redirect to the homepage
 *
 * Why a fire-and-forget fetch instead of `after(() => recordClick(...))`?
 * On Vercel, `after()` background writes proved NON-deterministic for 302
 * responses — some clicks were silently dropped (verified with live marker
 * probes: awaited writes in a normal request handler landed 100%, `after()`
 * writes ~randomly). The write therefore runs inside /api/track — a regular
 * POST handler — where it is awaited and deterministic.
 *
 * Delivery is belt-and-braces: each click gets a unique `eventId` and is
 * dispatched via BOTH a keepalive fetch (issued before the 302, so the
 * runtime flushes it even after the response goes out) AND an `after()`
 * retry carrying the same id. /api/track inserts with ON CONFLICT DO NOTHING,
 * so the retry that lands second is simply ignored — at-most-once per click
 * with two independent delivery paths. Any dispatch failure is logged but
 * never breaks the redirect.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  let destinationUrl: string | null = null;
  try {
    const link = await getRedirectLink(slug);
    if (link && link.isActive) {
      destinationUrl = link.destinationUrl;
    }
  } catch {
    destinationUrl = null;
  }

  if (!destinationUrl) {
    return NextResponse.redirect(new URL('/', new URL(request.url).origin));
  }

  // Capture geo/device/referrer/client info server-side BEFORE the redirect:
  // pure synchronous header parsing, no I/O, no added latency.
  const event = buildClickEvent(request);
  const eventId = randomUUID();

  const secret = process.env.TRACKING_SECRET?.trim();
  const dispatch = () =>
    fetch(`${new URL(request.url).origin}/api/track`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(secret ? { 'x-track-secret': secret } : {}),
      },
      body: JSON.stringify({ slug, event, eventId }),
      keepalive: true,
    }).catch((error) => {
      console.error(
        'track dispatch failed:',
        error instanceof Error ? error.message : error
      );
    });

  // Primary path — dispatched BEFORE the 302 is returned, never awaited, so
  // the redirect is not blocked and the outbound request is being flushed even
  // if the function is frozen right after the response goes out.
  const primary = dispatch();

  // Backup path — if the runtime honors after(), the function stays alive
  // briefly; a second dispatch with the SAME eventId covers a dropped primary.
  // Deduped downstream, so at most one row + one counter bump per click.
  after(() => {
    void primary;
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        void dispatch().then(() => resolve());
      }, 1000);
    });
  });

  return NextResponse.redirect(destinationUrl, 302);
}