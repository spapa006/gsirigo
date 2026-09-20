import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Notes:
// - `proxy.ts` replaces `middleware.ts` starting with Next.js 16.
// - Matches all pathnames except for `/api`, `/trpc`, `/_next`, `/_vercel`
//   and anything containing a dot (e.g. favicon.ico).
export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};