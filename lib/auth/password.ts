import bcrypt from 'bcryptjs';

/**
 * Password verification against the bcrypt hash stored in ADMIN_PASSWORD_HASH.
 * A plain bcrypt.compare already runs in (roughly) constant time; the caller
 * additionally applies a small delay on failure to slow brute-force attempts.
 */
export async function verifyPassword(
  password: string,
  hash: string | undefined
): Promise<boolean> {
  if (!hash || !password) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Returns a human-readable reason when ADMIN_PASSWORD_HASH looks malformed, or
 * null when it's a plausible bcrypt hash. Guards against the silent password
 * breakage caused by dotenv-expand mangling unescaped `$` in .env files
 * (e.g. `$2b$12$...` becoming `2b12...` when the `$` are not escaped as `\$`).
 */
export function verifyHashShape(
  hash: string | undefined
): string | null {
  if (!hash) return 'ADMIN_PASSWORD_HASH is not set.';
  if (!/^\$2[aby]\$\d{2}\$/.test(hash)) {
    return 'ADMIN_PASSWORD_HASH does not look like a bcrypt hash — every `$` must be escaped as `\\$` in the .env file (run `npm run password:hash`).';
  }
  if (hash.length !== 60) {
    return 'ADMIN_PASSWORD_HASH has an unexpected length — the hash may have been mangled; regenerate it with `npm run password:hash`.';
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}