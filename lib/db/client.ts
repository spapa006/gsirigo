import fs from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';
import { MIGRATION_STATEMENTS } from '@/lib/db/migrations';

/**
 * Gsirigo database connection.
 *
 * Local development (default):
 *   LIBSQL_URL=file:./data/gsirigo.db   → zero-config persistent SQLite file
 *
 * Production (Vercel / Turso):
 *   LIBSQL_URL=libsql://<database>.turso.io?tls=1
 *   LIBSQL_AUTH_TOKEN=<token>
 *
 * ⚠️ Do NOT import this module from Edge runtime code (proxy.ts, /go) — it
 * uses the Node libsql client. Edge code must use `@libsql/client/web` in the
 * route itself with a *remote* URL.
 */

function resolveUrl(): string {
  // Turso databases expose LIBSQL_URL (and LIBSQL_AUTH_TOKEN). Accept the
  // conventional DATABASE_URL as an alias for tooling that sets only that.
  const fromEnv =
    process.env.LIBSQL_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;
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
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  });
  return _client;
}

/** Idempotent, singleton bootstrap so HMR-safe in next dev. */
export function ensureTables(): Promise<void> {
  if (_migrating) return _migrating;
  _migrating = (async () => {
    const client = getClient();
    for (const statement of MIGRATION_STATEMENTS) {
      await client.execute(statement);
    }
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