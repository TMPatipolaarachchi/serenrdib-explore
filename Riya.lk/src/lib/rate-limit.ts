/**
 * Simple in-memory, fixed-window rate limiter.
 *
 * Good enough for a single server instance. For multiple instances (e.g. several
 * containers or serverless functions) swap this for a shared store such as Redis.
 * The admin login limiter does NOT use this — it is backed by the database
 * (see src/lib/admin-auth.ts) so it works across instances.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Periodically drop expired buckets so memory doesn't grow forever.
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    lastSweep = now;
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count++;

  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Clears a key, e.g. after a successful login. */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}
