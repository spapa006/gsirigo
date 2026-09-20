import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';

/**
 * Guards an admin API route handler:
 *  1. Re-checks the session cookie server-side (never trusts middleware alone).
 *  2. CSRF: rejects state-changing requests from foreign origins.
 *
 * Usage:
 *   const auth = await requireAdmin(request);
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireAdmin(request: Request): Promise<AdminAuth> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    if (origin) {
      const host = request.headers.get('host');
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      const allowed = (
        [siteUrl, host ? `https://${host}` : '', host ? `http://${host}` : ''] as string[]
      )
        .filter((u) => u.length > 0)
        .map((u) => {
          try {
            return new URL(u).origin;
          } catch {
            return '';
          }
        })
        .filter((o) => o.length > 0);
      if (!allowed.includes(origin)) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
    }
  }

  return session;
}

export type AdminAuth =
  | Awaited<ReturnType<typeof getServerSession>>
  | NextResponse;

/** Throws in server components when unauthenticated (redirects to login). */
export async function assertAdminPage(): Promise<void> {
  const session = await getServerSession();
  if (!session) {
    const { redirect } = await import('next/navigation');
    redirect('/admin/login');
  }
}