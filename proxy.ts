import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { getRequestSession } from './lib/auth/session';

// Notes:
// - `proxy.ts` replaces `middleware.ts` starting with Next.js 16.
// - Matches all pathnames except `/api`, `/trpc`, `/go` (route handler), `/_next`,
//   `/_vercel` and anything containing a dot (e.g. favicon.ico).
// - `/admin/*` is deliberately INSIDE the matcher so this proxy can enforce
//   the session — /go/[slug] is a pure route handler and needs no middleware.

const handleI18n = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Single-admin area protection ──────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // Login page is public. Everything else requires a valid admin session.
    if (pathname !== '/admin/login') {
      const session = await getRequestSession(request);
      if (!session) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
    // Admin routes are not localized — skip the next-intl middleware.
    return NextResponse.next();
  }

  return handleI18n(request);
}

export const config = {
  // Static root files (ads.txt, sitemap.xml, robots.txt) are excluded so the
  // next-intl proxy never locale-prefixes them — they must stay at the site
  // root. /go (route handler) and /api, /trpc, /_next, /_vercel are excluded
  // too; anything containing a dot (assets like /.well-known/…) is skipped.
  matcher: '/((?!api|trpc|go|ads\\.txt|sitemap\\.xml|robots\\.txt|_next|_vercel|.*\\..*).*)',
};