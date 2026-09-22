import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { redirectClicks } from '@/db/schema';
import { getClient, withDb } from '@/lib/db/client';

/**
 * TEMPORARY diagnostic 2 — REMOVE before shipping.
 *
 *   /api/diag2?m=1
 *
 * A TX-SYNC     awaited  drizzle db.transaction + insert   (err in response)
 * B PLAIN-SYNC  awaited  drizzle plain insert              (err in response)
 * E RAW-SYNC    awaited  raw client.execute INSERT         (err in response)
 * F BATCH-SYNC  awaited  raw client.batch([INSERT],'write')(err in response)
 * C TX-AFTER    after()  drizzle db.transaction + insert    (marker row)
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const now = () => new Date();

export async function GET(request: Request) {
  const run = new URL(request.url).searchParams.get('m') ?? '1';
  const res: Record<string, unknown> = { run };

  // A — drizzle transaction, awaited.
  try {
    await withDb(async (db) => {
      await db.transaction(async (tx) => {
        await tx.insert(redirectClicks).values({
          slug: 'alamo',
          clickedAt: now(),
          country: `TX-SYNC-${run}`,
          isBot: true,
          userAgent: `diag2-TX-SYNC-${run}`,
        });
      });
    });
    res.txSyncOk = true;
  } catch (error) {
    res.txSyncErr = error instanceof Error ? error.message : String(error);
  }

  // B — drizzle plain insert, awaited.
  try {
    await withDb(async (db) => {
      await db.insert(redirectClicks).values({
        slug: 'alamo',
        clickedAt: new Date(),
        country: `PLAIN-SYNC-${run}`,
        isBot: true,
        userAgent: `diag2-PLAIN-SYNC-${run}`,
      });
    });
    res.plainSyncOk = true;
  } catch (error) {
    res.plainSyncErr = error instanceof Error ? error.message : String(error);
  }

  // C — drizzle transaction inside after(). Marker row proves it ran.
  after(() => {
    withDb(async (db) => {
      await db.transaction(async (tx) => {
        await tx.insert(redirectClicks).values({
          slug: 'alamo',
          clickedAt: new Date(),
          country: `TX-AFTER-${run}`,
          isBot: true,
          userAgent: `diag2-TX-AFTER-${run}`,
        });
      });
    }).catch((error) => console.error('diag2 TX-AFTER failed:', error));
  });

  // E — raw execute, awaited.
  try {
    await getClient().execute({
      sql: `INSERT INTO redirect_clicks (slug, clicked_at, country, is_bot, user_agent)
            VALUES ('alamo', ${Math.floor(Date.now() / 1000)}, ?, 1, ?)`,
      args: [`RAW-SYNC-${run}`, `diag2-RAW-SYNC-${run}`],
    });
    res.rawSyncOk = true;
  } catch (error) {
    res.rawSyncErr = error instanceof Error ? error.message : String(error);
  }

  // F — raw client.batch 'write', awaited.
  try {
    await getClient().batch(
      [
        {
          sql: `INSERT INTO redirect_clicks (slug, clicked_at, country, is_bot, user_agent)
                VALUES ('alamo', ${Math.floor(Date.now() / 1000)}, ?, 1, ?)`,
          args: [`BATCH-SYNC-${run}`, `diag2-BATCH-SYNC-${run}`],
        },
      ],
      'write'
    );
    res.batchSyncOk = true;
  } catch (error) {
    res.batchSyncErr = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(res);
}