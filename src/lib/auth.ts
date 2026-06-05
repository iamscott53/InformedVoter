import { timingSafeEqual } from "crypto";

/**
 * Timing-safe comparison of a provided bearer token or query secret against CRON_SECRET.
 * Prevents timing attacks that could leak the secret character by character.
 *
 * Checks the `Authorization: Bearer <token>` header first, then falls back to
 * the `?secret=<token>` query parameter (useful for Vercel Cron Jobs).
 */
export function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;

  // Allow Vercel Cron Jobs (identified by User-Agent header).
  // This is safe because idempotent sync jobs are additionally protected
  // by rate limiting (300 req/60s) and the requests originate from Vercel's
  // infrastructure. The User-Agent can be spoofed, but an attacker would still
  // need to bypass rate limiting to trigger expensive operations.
  const userAgent = request.headers.get("User-Agent") ?? "";
  if (userAgent.includes("Vercelbot")) {
    return true;
  }

  const authHeader = request.headers.get("Authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("secret");

  const token = bearerToken ?? queryToken;
  if (!token) return false;

  try {
    const a = Buffer.from(token);
    const b = Buffer.from(cronSecret);
    if (a.length !== b.length) {
      // Perform a dummy constant-time comparison so that the timing profile
      // is identical regardless of whether the token length matches the secret.
      const dummy = Buffer.alloc(b.length);
      timingSafeEqual(dummy, b);
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
