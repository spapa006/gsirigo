import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { getRedirectLink, recordClick } from '@/lib/db/repositories/redirects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Why Node runtime instead of Edge?
// The admin redirect feature must work against BOTH the local `file:` dev DB
// and a remote Turso DB in production. The libsql Node client supports both;
// the Edge web client only speaks remote HTTP. Redirects are still fast —
// a single indexed PK lookup — and click tracking is deliberately deferred
// with `after()` so the 302 is never blocked. To switch to Edge, use
// `@libsql/client/web` in lib/db/client.ts and set runtime = 'edge' (remote
// LIBSQL_URL required).

/**
 * Public cloaked affiliate link: /go/dubai-rentalcars
 *
 * - Found + active  → increment clicks (async, non-blocking) → 302
 * - Missing/inactive → redirect to the homepage
 */
export async function GET(
  _request: Request,
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
    return NextResponse.redirect(new URL('/', new URL(_request.url).origin));
  }

  // Fire the click increment AFTER the redirect response is sent; failures
  // are swallowed so analytics can never break a redirect.
  after(() => {
    void recordClick(slug).catch(() => {});
  });

  return NextResponse.redirect(destinationUrl, 302);
}