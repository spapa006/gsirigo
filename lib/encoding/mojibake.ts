/**
 * Helpers to detect and reverse Arabic text-encoding corruption (UTF-8
 * "mojibake"): the UTF-8 bytes of proper Arabic were at some point interpreted
 * as legacy windows-1252 characters and re-saved as UTF-8 (a double encoding).
 * The public site, the admin UI, and Turso all end up storing/showing the
 * garbled forms like "ØªØ£Ø¬ÙŠØ±".
 *
 * Reversing requires a windows-1252 → byte mapping (NOT plain Latin-1): cp1252
 * positions such as 0x8A ('Š' U+0160), 0x94 ('"' U+201D) etc. are re-mapped to
 * their original bytes before decoding the byte stream as UTF-8.
 *
 * Real-world sample healed by this module:
 *   "ØªØ£Ø¬ÙŠØ± Ø³ÙŠØ§Ø±Ø§Øª …"  →  "تأجير سيارات …"
 */

/** windows-1252 bytes that differ from Latin-1 (byte → single char). */
const CP1252_TO_CHAR: Record<number, string> = {
  0x80: '\u20ac', 0x82: '\u201a', 0x83: '\u0192', 0x84: '\u201e', 0x85: '\u2026',
  0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02c6', 0x89: '\u2030', 0x8a: '\u0160',
  0x8b: '\u2039', 0x8c: '\u0152', 0x8e: '\u017d', 0x91: '\u2018', 0x92: '\u2019',
  0x93: '\u201c', 0x94: '\u201d', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02dc', 0x99: '\u2122', 0x9a: '\u0161', 0x9b: '\u203a', 0x9c: '\u0153',
  0x9e: '\u017e', 0x9f: '\u0178',
};

const CHAR_TO_CP1252: Record<string, number> = {};
for (const [byte, char] of Object.entries(CP1252_TO_CHAR)) {
  CHAR_TO_CP1252[char] = Number(byte);
}

const ARABIC = /[\u0600-\u06FF]/;

/** Encode a mojibake string back into its original bytes (cp1252 semantics). */
export function cp1252ToBytes(input: string): number[] {
  const bytes: number[] = [];
  for (const char of input) {
    const code = char.codePointAt(0)!;
    if (code < 0x80) {
      bytes.push(code);
    } else if (CHAR_TO_CP1252[char] !== undefined) {
      bytes.push(CHAR_TO_CP1252[char]);
    } else if (code <= 0xff) {
      // Undefined cp1252 slots (0x81, 0x8D…) pass through as raw continuation
      // bytes — they become valid once the full stream is UTF-8 decoded.
      bytes.push(code);
    } else {
      // Not representable in one byte — would corrupt the heal. Push a byte
      // that guarantees a U+FFFD so the validation below rejects this input.
      bytes.push(0x3f);
    }
  }
  return bytes;
}

/**
 * Reverse a UTF-8 → windows-1252 → UTF-8 double-encoding.
 *
 * Returns the healed Arabic string ONLY when the input is real mojibake —
 * i.e. the healed result contains Arabic, contains no U+FFFD replacement
 * chars, and differs from the input. Returns null for anything else (already
 * correct, empty, non-Arabic, or not recoverable) so callers can keep the
 * original value untouched.
 */
export function healArabicMojibake(input: string): string | null {
  if (!input) return null;
  if (ARABIC.test(input)) return null; // already proper Arabic (or mixed) — leave alone
  const healed = Buffer.from(cp1252ToBytes(input)).toString('utf8');
  if (healed === input) return null;
  if (healed.includes('\ufffd')) return null;
  if (!ARABIC.test(healed)) return null;
  return healed;
}

/** True when the string shows the classic Arabic-mojibake marker characters. */
export function looksLikeArabicMojibake(input: string): boolean {
  if (!input || ARABIC.test(input)) return false;
  // Latin-1 accented letters (U+00C0–U+00FF) / cp1252 specials mark the pattern.
  return /[\u00c0-\u00ff\u0160\u0161\u017d\u017e\u0152\u0153\u2018-\u201d\u2013\u2014\u2026\u2039\u203a\u2030\u02c6\u02dc\u2122\u0192\u2020\u2021\u20ac]/.test(
    input,
  );
}