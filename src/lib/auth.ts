import { timingSafeEqual } from "crypto";

/**
 * Timing-safe comparison of a provided bearer token against CRON_SECRET.
 * Prevents timing attacks that could leak the secret character by character.
 */
export function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return false;

  try {
    const a = Buffer.from(token);
    const b = Buffer.from(cronSecret);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
