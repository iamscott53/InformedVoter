import { Redis } from "@upstash/redis";

// ─────────────────────────────────────────────
// Upstash Redis client (edge-compatible)
// Gracefully absent if env vars are not set.
// ─────────────────────────────────────────────

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });
}

// ─────────────────────────────────────────────
// Fixed-window rate limiter
//
// Returns { allowed: true } when the request should proceed.
// Returns { allowed: false } when the limit is exceeded.
// Falls back to allowing all requests when Redis is not configured,
// so the app continues to work without Redis during development.
// ─────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  /** Approximate remaining requests in the current window */
  remaining: number;
  /** Seconds until the current window resets */
  retryAfter: number;
}

/**
 * @param identifier  Unique key, e.g. `pub:${ip}` or `auth:${ip}`
 * @param limit       Max requests allowed per window
 * @param windowSec   Window duration in seconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  if (!redis) {
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }

  try {
    const window = Math.floor(Date.now() / (windowSec * 1000));
    const key = `rl:${identifier}:${window}`;

    const count = await redis.incr(key);
    if (count === 1) {
      // Set TTL only on first request in window to avoid race
      await redis.expire(key, windowSec);
    }

    const remaining = Math.max(0, limit - count);
    const secondsIntoWindow = (Date.now() / 1000) % windowSec;
    const retryAfter = Math.ceil(windowSec - secondsIntoWindow);

    return { allowed: count <= limit, remaining, retryAfter };
  } catch {
    // Redis error — fail open to avoid blocking legitimate users
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
}
