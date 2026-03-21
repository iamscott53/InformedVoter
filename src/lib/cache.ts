import { Redis } from "@upstash/redis";

// Lazily initialize the Redis client so the app doesn't crash when the env
// variable is absent (e.g. local development without Upstash configured).
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch {
    console.warn("[cache] Failed to initialize Redis client.");
    return null;
  }
}

/**
 * Retrieve a cached value by key.
 * Returns null when Redis is unavailable or the key does not exist.
 */
export async function getCached<T = unknown>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const value = await client.get<T>(key);
    return value ?? null;
  } catch (err) {
    console.error(`[cache] getCached error for key "${key}":`, err);
    return null;
  }
}

/**
 * Store a value in the cache with an optional TTL (in seconds).
 * No-ops silently when Redis is unavailable.
 */
export async function setCached(
  key: string,
  value: unknown,
  ttlSeconds = 3600
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.error(`[cache] setCached error for key "${key}":`, err);
  }
}

/**
 * Remove a key from the cache.
 * No-ops silently when Redis is unavailable.
 */
export async function invalidateCache(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(key);
  } catch (err) {
    console.error(`[cache] invalidateCache error for key "${key}":`, err);
  }
}
