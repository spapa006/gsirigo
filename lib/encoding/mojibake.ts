/**
 * Helpers to detect and reverse text-encoding corruption (UTF-8 "mojibake"):
 * the UTF-8 bytes of proper text (Arabic or European accented letters) were
 * at some point interpreted as legacy windows-1252 characters and re-saved as
 * UTF-8 (a double encoding). The public site, the admin UI, and Turso all end
 * up storing/showing the garbled forms like "ØªØ£Ø¬ÙŠØ±" (Arabic) or
 * "chÃ¨res"/"CÃ³mo" (French/Spanish accents).
 *
 * Reversing requires a windows-1252 → byte mapping (NOT plain Latin-1): cp1252
 * positions such as 0x8A ('Š' U+0160), 0x94 ('"' U+201D) etc. are re-mapped to
 * their original bytes before decoding the byte stream as UTF-8.
 *
 * Real-world samples healed by this module:
 *   "ØªØ£Ø¬ÙŠØ± Ø³ÙŠØ§Ø±Ø§Øª …"  →  "تأجير سيارات …"
 *   "moins chÃ¨res en 2026"     →  "moins chères en 2026"
 *   "CÃ³mo ahorrar"             →  "Cómo ahorrar"
 *
 * Healing is conservative: the input is only rewritten when the transformed
 * result is valid UTF-8 (no U+FFFD), differs from the input, and contains
 * non-ASCII characters (Arabic or accented Latin). Legitimate accented text
 * (e.g. French "Âge du conducteur", guillemets, em dashes) fails those checks
 * and is left untouched.
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
const NON_ASCII = /[^\x00-\x7F]/;

/**
 * Marker characters that indicate a file may contain mojibake: Latin-1
 * accented letters (U+00C0–U+00FF) and the cp1252 specials. Used only as a
 * cheap pre-filter before the strict heal() check.
 */
const MARKERS = /[\u00c0-\u00ff\u0160\u0161\u017d\u017e\u0152\u0153\u2018-\u201d\u2013\u2014\u2026\u2039\u203a\u2030\u02c6\u02dc\u2122\u0192\u2020\u2021\u20ac]/;

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
 * Returns the healed string ONLY when the input is real mojibake whose healed
 * form is valid Arabic or accented Latin (no U+FFFD replacement chars).
 * Returns null for anything else (already correct, empty, non-mojibake, or not
 * recoverable) so callers can keep the original value untouched.
 */
export function healMojibake(input: string): string | null {
  if (!input) return null;
  if (!NON_ASCII.test(input)) return null; // pure ASCII can't be double-encoded
  if (ARABIC.test(input)) return null; // already proper Arabic (or mixed) — leave alone
  const healed = Buffer.from(cp1252ToBytes(input)).toString('utf8');
  if (healed === input) return null;
  if (healed.includes('\ufffd')) return null;
  if (!NON_ASCII.test(healed)) return null; // healed must carry real non-ASCII (Arabic/accent)
  return healed;
}

/** Backwards-compatible alias (Arabic was the first supported case). */
export const healArabicMojibake = healMojibake;

/** True when the string shows a character set that may contain mojibake. */
export function looksLikeMojibake(input: string): boolean {
  if (!input || ARABIC.test(input)) return false;
  return MARKERS.test(input);
}

/** Backwards-compatible alias. */
export const looksLikeArabicMojibake = looksLikeMojibake;