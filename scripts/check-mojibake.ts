/**
 * Fails the build/lint when any scanned locale file contains Arabic UTF-8
 * mojibake (catches the corruption before it reaches the DB via db:seed).
 *
 *   npm run check:mojibake
 */
import fs from 'node:fs';
import path from 'node:path';
import { healArabicMojibake, looksLikeArabicMojibake } from '@/lib/encoding/mojibake';

const ROOTS = ['content', 'messages', 'lib'];
const TEXT_EXTENSIONS = new Set(['.mdx', '.md', '.json', '.ts', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'data']);

function* walkFiles(dir: string): Generator<string> {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walkFiles(filePath);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      yield filePath;
    }
  }
}

const stripBom = (s: string) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);

const corrupted: string[] = [];
for (const root of ROOTS) {
  if (!fs.existsSync(root)) continue;
  for (const file of walkFiles(root)) {
    let raw: string;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (!looksLikeArabicMojibake(raw)) continue;
    if (healArabicMojibake(stripBom(raw)) !== null) corrupted.push(file);
  }
}

if (corrupted.length > 0) {
  console.error(`✗ Arabic mojibake detected in ${corrupted.length} file(s):`);
  for (const file of corrupted) console.error(`   - ${file}`);
  console.error(`\nRun: npm run repair:mojibake -- --apply`);
  process.exit(1);
}

console.log('✓ No Arabic mojibake in locale files.');