import { NextResponse } from 'next/server';
import { after } from 'next/server';
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
 * POST handler — where it is awaited and deterministic. The fetch is issued
 * BEFORE the 302 is returned and marked keepalive:true so the runtime flushes
 * it even after the response goes out; `after()` merely extends the function
 * lifetime for the fetch to complete when the runtime honors it. Any dispatch
 * failure is logged but never breaks the redirect.
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

  // Dispatch the click to the tracking route. Not awaited — the 302 goes out
  // immediately; keepalive ensures the outbound request is flushed even after
  // the response is sent.
  const secret = process.env.TRACKING_SECRET?.trim();
  const trackPromise = fetch(`${new URL(request.url).origin}/api/track`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(secret ? { 'x-track-secret': secret } : {}),
    },
    body: JSON.stringify({ slug, event }),
    keepalive: true,
  }).catch((error) => {
    console.error(
      'track dispatch failed:',
      error instanceof Error ? error.message : error
    );
  });

  // Best-effort lifetime extension so the fetch can finish; never awaited, so
  // it can never delay or break the redirect.
  after(() => {
    void trackPromise;
  });

  return NextResponse.redirect(destinationUrl, 302);
}