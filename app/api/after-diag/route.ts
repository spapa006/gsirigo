import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { redirectClicks } from '@/db/schema';
import { withDb } from '@/lib/db/client';
import { buildClickEvent } from '@/lib/analytics/click-event';

/**
 * TEMPORARY diagnostic — REMOVE before shipping.
 *
 * Answers: does the Vercel Node runtime run `after()` callbacks for this
 * route pattern, and do DB writes work from the lambda at all?
 *
 *   /api/after-diag?m=1
 *
 * Writes two marker rows to redirect_clicks (slug=alamo, is_bot=1 so the
 * real click_count is never touched):
 *   country='DIAG-SYNC-N'   awaited inline before the response
 *   country='DIAG-AFTER-N'  inside after()
 *
 * Whichever rows land in Turso tells us what works. (Check with data/….)
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function marker(country: string, run: string) {
  return {
    slug: 'alamo',
    clickedAt: new Date(),
    country,
    isBot: true,
    userAgent: `diag-${country}-${run}`,
  } as const;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const run = url.searchParams.get('m') ?? '1';

  // 1) Awaited inline write — full error propagation (no swallow).
  let syncOk = false;
  let syncErr = '';
  try {
    await withDb(async (db) => {
      await db.insert(redirectClicks).values(marker('DIAG-SYNC', run));
    });
    syncOk = true;
  } catch (error) {
    syncErr = error instanceof Error ? error.message : String(error);
  }

  // 2) after() deferred write — same write pattern as /go recordClick.
  after(() => {
    try {
      const event = buildClickEvent(
        new Request('https://gsirigo.com/go/alamo', {
          headers: { 'user-agent': 'curl/8.7.1' },
        })
      );
      return withDb(async (db) => {
        await db.insert(redirectClicks).values({
          slug: 'alamo',
          clickedAt: new Date(),
          country: `DIAG-AFTER-${run}`,
          isBot: true,
          userAgent: 'diag-after',
          ipHash: event.ipHash,
        });
      }).catch((error) => {
        console.error('DIAG after() write failed:', error);
      });
    } catch (error) {
      console.error('DIAG after() callback threw:', error);
    }
  });

  return NextResponse.json({ run, syncOk, syncErr, afterScheduled: true });
}