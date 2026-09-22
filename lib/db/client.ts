import fs from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';
import {
  MIGRATION_STATEMENTS,
  renameLegacyRedirectClicks,
  copyLegacyRedirectClicks,
} from '@/lib/db/migrations';

/**
 * Gsirigo database connection.
 *
 * Vercel Turso Marketplace integration (preferred in production):
 *   TURSO_DATABASE_URL=libsql://<database>-<org>.turso.io
 *   TURSO_AUTH_TOKEN=<token>
 *
 * Manual setup (or dev tooling):
 *   LIBSQL_URL=libsql://<database>.turso.io?tls=1
 *   LIBSQL_AUTH_TOKEN=<token>
 *   DATABASE_URL is accepted as an alias for the URL.
 *
 * Precedence for the URL: TURSO_DATABASE_URL > LIBSQL_URL > DATABASE_URL.
 * Precedence for the token: TURSO_AUTH_TOKEN > LIBSQL_AUTH_TOKEN.
 *
 * Local development (default, when none of the above are set):
 *   file:./data/gsirigo.db → zero-config persistent SQLite file
 *
 * ⚠️ Do NOT import this module from Edge runtime code (proxy.ts, /go) — it
 * uses the Node libsql client. Edge code must use `@libsql/client/web` in the
 * route itself with a *remote* URL.
 */

function resolveUrl(): string {
  const fromEnv =
    process.env.TURSO_DATABASE_URL?.trim() ||
    process.env.LIBSQL_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;

  // Production safety net: without a remote URL, the file fallback targets an
  // ephemeral serverless filesystem — admin writes would silently "succeed"
  // and never persist, or crash with a confusing EACCES. Fail loudly instead.
  // Self-hosters running `next start` locally can opt back into the file DB
  // with GSIRIGO_ALLOW_FILE_DB=1 (reads fall back to static content anyway,
  // so public pages are unaffected).
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.GSIRIGO_ALLOW_FILE_DB !== '1'
  ) {
    throw new Error(
      'Admin writes are disabled: no Turso database URL configured. ' +
        'Set TURSO_DATABASE_URL (Vercel Turso integration), LIBSQL_URL, or ' +
        'DATABASE_URL — plus the matching TURSO_AUTH_TOKEN / LIBSQL_AUTH_TOKEN ' +
        '— in the Vercel env var panel, or set GSIRIGO_ALLOW_FILE_DB=1 to ' +
        'allow the local file DB (self-host only).'
    );
  }

  // Default local dev database file.
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return `file:${path.join(dataDir, 'gsirigo.db').replace(/\\/g, '/')}`;
}

let _client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;
let _migrating: Promise<void> | null = null;

export function getClient(): Client {
  if (_client) return _client;
  _client = createClient({
    url: resolveUrl(),
    authToken:
      process.env.TURSO_AUTH_TOKEN?.trim() ||
      process.env.LIBSQL_AUTH_TOKEN?.trim() ||
      undefined,
  });
  return _client;
}

/** Idempotent, singleton bootstrap so HMR-safe in next dev. */
export function ensureTables(): Promise<void> {
  if (_migrating) return _migrating;
  _migrating = (async () => {
    const client = getClient();
    // The pre-analytics deploy shipped `redirect_clicks` as a uuid log
    // (id/slug/clicked_at only). CREATE TABLE IF NOT EXISTS can't change an
    // existing table's shape, so the legacy table is renamed first, the new
    // event-shaped table is created by the statements below, then legacy rows
    // are copied across and the old table dropped.
    await renameLegacyRedirectClicks(client);
    for (const statement of MIGRATION_STATEMENTS) {
      await client.execute(statement);
    }
    await copyLegacyRedirectClicks(client);
    _migrating = null;
  })().catch((error) => {
    _migrating = null;
    throw error;
  });
  return _migrating;
}

export function getDb(): LibSQLDatabase<typeof schema> {
  if (_db) return _db;
  _db = drizzle(getClient(), { schema });
  return _db;
}

export type GsirigoDb = LibSQLDatabase<typeof schema>;

/** Convenience guard for repository reads when the DB is unreachable. */
export async function withDb<T>(fn: (db: GsirigoDb) => Promise<T> | T): Promise<T> {
  await ensureTables();
  return fn(getDb());
}