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

    // Atomically initialise the key with a TTL if it does not yet exist.
    // `set nx` is atomic, so even under a race only one request creates the
    // key — but all requests can safely increment afterwards.
    await redis.set(key, "0", { nx: true, ex: windowSec });
    const count = await redis.incr(key);

    const remaining = Math.max(0, limit - count);
    const secondsIntoWindow = (Date.now() / 1000) % windowSec;
    const retryAfter = Math.ceil(windowSec - secondsIntoWindow);

    return { allowed: count <= limit, remaining, retryAfter };
  } catch {
    // Redis error — fail open to avoid blocking legitimate users
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }
}

/**
 * Acquire a distributed lock via Redis SET NX EX.
 * Returns `true` if the lock was acquired, `false` if it is already held.
 * Automatically expires after `ttlSec` to prevent deadlocks.
 */
export async function acquireLock(key: string, ttlSec: number): Promise<boolean> {
  if (!redis) return true; // Fail open if Redis is unavailable
  try {
    const acquired = await redis.set(`lock:${key}`, "1", { nx: true, ex: ttlSec });
    return acquired === "OK";
  } catch {
    return true; // Fail open on Redis error
  }
}
