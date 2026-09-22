import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { pruneOldClickEvents } from '@/lib/db/repositories/redirects';
import { serverErrorResponse } from '@/lib/api/error-response';

export const runtime = 'nodejs';
// Cold-start + remote Turso handshake can exceed the default on the first
// run; raise the cap so aggregations don't end up as opaque 504s.
export const maxDuration = 60;

/**
 * Monthly data-retention job (via Vercel Cron, trigger: `/api/cron/prune-clicks`)
 * OR a manual admin action (same endpoint, admin session cookie).
 *
 * Aggregates raw redirect click events older than 12 months into monthly
 * rollup rows (redirect_click_rollups) and deletes the raw rows, so the
 * event table doesn't grow unbounded. Idempotent + atomic.
 *
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically when
 * a CRON_SECRET env var is configured; we fall back to a real admin session so
 * the same route doubles as the manual "prune now" action in /admin.
 */
async function handle(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get('authorization') ?? '';
  const isCron =
    cronSecret !== undefined && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const admin = await requireAdmin(request);
    if (admin instanceof NextResponse) return admin;
  }

  try {
    const result = await pruneOldClickEvents(12);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}