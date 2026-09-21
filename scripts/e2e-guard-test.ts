/**
 * Connection-layer guard tests (directive: "throws a clear, descriptive
 * error, not a silent fallback, when LIBSQL_URL is missing or invalid").
 *
 *   GUARD_SCENARIO=missing  → NODE_ENV=production, no LIBSQL_URL:
 *                            getClient() must throw a descriptive error.
 *
 *   GUARD_SCENARIO=remote   → LIBSQL_URL points at an unreachable/bogus host:
 *                            withDb() must throw the real driver error.
 */
import { getClient, withDb } from '../lib/db/client';

async function main() {
  const scenario = process.env.GUARD_SCENARIO;

  if (scenario === 'missing') {
    try {
      getClient();
      console.error('FAIL: production connection silently fell back to a file DB');
      process.exitCode = 1;
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`thrown message: ${msg}`);
      const ok = msg.includes('LIBSQL_URL') && msg.includes('Admin writes');
      console.log(ok ? 'PASS: descriptive error when LIBSQL_URL missing in production' : 'FAIL: error is not descriptive');
      if (!ok) process.exitCode = 1;
    }
    return;
  }

  if (scenario === 'remote') {
    console.log('remote URL:', process.env.LIBSQL_URL);
    try {
      await withDb(async () => { /* any write/read would fail on DB access */ });
      console.error('FAIL: bogus remote did NOT throw');
      process.exitCode = 1;
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`thrown message: ${msg}`);
      const ok = msg.length > 0 && !/^Failed to save/.test(msg);
      console.log(ok ? 'PASS: real underlying driver error surfaced' : 'FAIL: error hidden or generic');
      if (!ok) process.exitCode = 1;
    }
    return;
  }

  console.error('set GUARD_SCENARIO=missing|remote');
  process.exitCode = 1;
}

main().catch((e) => {
  console.error('guard test crashed:', e);
  process.exitCode = 1;
});