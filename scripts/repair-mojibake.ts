/**
 * Scan for — and optionally fix — Arabic UTF-8 mojibake in locale content
 * files (MDX/articles, JSON messages, TS catalogs).
 *
 *   npm run repair:mojibake            # dry run: report what would change
 *   npm run repair:mojibake -- --apply # write the fixed files
 *   npm run repair:mojibake -- --apply content/messages lib/messages
 *
 * Only files whose healed content is real Arabic (no U+FFFD) are touched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { healArabicMojibake, looksLikeArabicMojibake } from '@/lib/encoding/mojibake';

const APPLY = process.argv.includes('--apply');
const argRoots = process.argv.slice(2).filter((arg) => arg !== '--apply');
const ROOTS = argRoots.length > 0 ? argRoots : ['content', 'messages', 'lib'];

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

const findings: { file: string; healed: string; hadBom: boolean }[] = [];

for (const root of ROOTS) {
  if (!fs.existsSync(root)) {
    console.error(`✗ Path does not exist: ${root}`);
    continue;
  }
  for (const file of walkFiles(root)) {
    let raw: string;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (!looksLikeArabicMojibake(raw)) continue;
    const hadBom = raw.charCodeAt(0) === 0xfeff;
    const healed = healArabicMojibake(stripBom(raw));
    if (healed !== null) findings.push({ file, healed, hadBom });
  }
}

if (findings.length === 0) {
  console.log('✓ No Arabic mojibake found in scanned files.');
  process.exit(0);
}

console.log(`Found ${findings.length} file(s) with Arabic mojibake:\n`);
for (const { file, healed } of findings) {
  const beforeTitle = rawTitle(file);
  const afterTitle = healed
    .split('\n')
    .find((line) => /^title:/i.test(line) || line.includes('"brand"'))
    ?.trim();
  console.log(`== ${file}`);
  console.log(`   before: ${beforeTitle ?? healed.slice(0, 80)}`);
  console.log(`   after : ${afterTitle ?? healed.slice(0, 80)}`);
}

if (!APPLY) {
  console.log('\nDry run — nothing was changed. Re-run with --apply to write the fixes.');
  process.exit(0);
}

let fixed = 0;
for (const { file, healed, hadBom } of findings) {
  fs.writeFileSync(file, hadBom ? `\uFEFF${healed}` : healed, 'utf8');
  fixed += 1;
}
console.log(`\n✓ Fixed ${fixed} file(s).`);

function rawTitle(file: string): string | undefined {
  try {
    return fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .find((line) => /^title:/i.test(line) || line.includes('"brand"'))
      ?.trim();
  } catch {
    return undefined;
  }
}