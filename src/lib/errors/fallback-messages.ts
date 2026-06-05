// ─────────────────────────────────────────────
// Fallback Messages by HTTP Status Code
//
// Manually written, user-friendly messages for every status.
// NEVER auto-generated from external sources.
// ─────────────────────────────────────────────

const FALLBACK_MESSAGES: Record<number, string> = {
  400: "The request could not be processed. Please check your input and try again.",
  401: "Unauthorized.",
  403: "Access denied.",
  404: "This page cannot be found.",
  429: "Too many requests. Please slow down.",
  500: "We're experiencing a technical issue. Please try again later.",
  502: "We're having trouble connecting to our data source. Please try again later.",
  503: "Service temporarily unavailable. Please try again later.",
};

/**
 * Returns a manually written user-friendly message for the given HTTP status code.
 * Falls back to a generic message for unknown codes.
 */
export function getFallbackMessage(statusCode: number): string {
  return (
    FALLBACK_MESSAGES[statusCode] ??
    "Something went wrong. Please try again later."
  );
}
