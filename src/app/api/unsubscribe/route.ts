import { prisma } from "@/lib/db";
import { BASE_URL } from "@/lib/resend";

// ─────────────────────────────────────────────
// GET/POST /api/unsubscribe?token=xxx
// Supports both:
//   GET  — one-click from email body
//   POST — one-click from email client's native unsubscribe (RFC 8058)
// Returns HTML page (not JSON) since users come from email
// ─────────────────────────────────────────────

function htmlPage(title: string, message: string): Response {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — InformedVoter</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;display:flex;justify-content:center;align-items:center;min-height:100vh;">
  <div style="max-width:440px;text-align:center;padding:40px 24px;">
    <h1 style="color:#1B2A4A;font-size:24px;margin:0 0 12px;">${title}</h1>
    <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">${message}</p>
    <a href="${BASE_URL}" style="display:inline-block;background:#1B2A4A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Go to InformedVoter</a>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function handleUnsubscribe(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();

    if (!token) {
      return htmlPage("Invalid Link", "This unsubscribe link is missing or malformed.");
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      return htmlPage("Invalid Link", "This unsubscribe link is invalid or has already been used.");
    }

    // Hard delete — clean removal
    await prisma.subscriber.delete({ where: { id: subscriber.id } });

    return htmlPage(
      "You've Been Unsubscribed",
      "We're sorry to see you go. You won't receive any more emails from InformedVoter."
    );
  } catch (error) {
    console.error("[unsubscribe] Error:", error);
    return htmlPage("Something Went Wrong", "Please try again later.");
  }
}

export const GET = handleUnsubscribe;
export const POST = handleUnsubscribe;
