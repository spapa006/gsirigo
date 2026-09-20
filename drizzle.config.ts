import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config for the Gsirigo SQLite (libsql) database.
 *
 * This is a convenience for `drizzle-kit push` / `generate`. The runtime
 * bootstrap (lib/db/migrations.ts) creates the tables automatically on first
 * boot, so these files are kept in sync manually — run `drizzle-kit push`
 * against the local file DB after editing db/schema.ts to verify the SQL.
 */
export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.LIBSQL_URL ?? process.env.DATABASE_URL ?? 'file:./data/gsirigo.db',
    authToken: process.env.LIBSQL_AUTH_TOKEN,
  },
  verbose: true,
  strict: true,
});