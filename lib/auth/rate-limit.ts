/**
 * Minimal in-memory brute-force protection for the admin login.
 *
 * Limits login attempts per IP (5 per 15 minutes). In-memory state is
 * sufficient for a single-admin site; on serverless production across many
 * instances you'd swap this for a shared store (Vercel KV / Upstash
 * Ratelimit). bcrypt verification in lib/auth/password.ts is the second,
 * heavier line of defense.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type Attempt = { count: number; resetAt: number };

const buckets = new Map<string, Attempt>();

/** Returns remaining attempts (> 0) or 0 when the IP is blocked. */
export function checkRateLimit(key: string): number {
  prune();
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return MAX_ATTEMPTS - 1;
  }
  bucket.count += 1;
  return Math.max(0, MAX_ATTEMPTS - bucket.count);
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

function prune(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export { MAX_ATTEMPTS };