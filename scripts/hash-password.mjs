/**
 * Prints bcrypt hashes of a password, for the ADMIN_PASSWORD_HASH env var.
 *
 * Usage: npm run password:hash -- "<password>"
 *
 * Next.js env files expand `$var` sequences (dotenv-expand), so bcrypt hashes
 * (which contain `$`) are silently corrupted unless every `$` is escaped as
 * `\$`. This script prints the ready-to-paste escaped form as well as the raw.
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run password:hash -- "<password>"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const escaped = hash.replace(/\$/g, '\\$');

console.log(`\nRaw bcrypt hash:\n${hash}\n`);
console.log('For ADMIN_PASSWORD_HASH in a .env file, use the ESCAPED form:');
console.log(`${escaped}\n`);
console.log('(Every `$` is escaped as `\\$` because Next.js expands $var in env files.)');