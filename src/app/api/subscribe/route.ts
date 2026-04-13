import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { buildVerificationEmail } from "@/lib/email/verification-template";

// ─────────────────────────────────────────────
// POST /api/subscribe
// Body: { email: string, stateAbbr: string }
// ─────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.trim().toLowerCase();
    const stateAbbr = (body.stateAbbr as string)?.trim().toUpperCase();

    if (!email || !EMAIL_RE.test(email)) {
      return Response.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (email.length > 254) {
      return Response.json(
        { error: "Email address is too long." },
        { status: 400 }
      );
    }

    if (!stateAbbr || !VALID_STATES.has(stateAbbr)) {
      return Response.json(
        { error: "Please select a valid US state." },
        { status: 400 }
      );
    }

    // Upsert: if already verified, silently succeed (no enumeration leak)
    // If unverified, regenerate token and re-send
    const existing = await prisma.subscriber.findUnique({
      where: { email },
      select: { verified: true },
    });

    if (existing?.verified) {
      // Already subscribed — respond identically to prevent enumeration
      return Response.json({
        success: true,
        message: "Check your email to confirm your subscription.",
      });
    }

    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      create: { email, stateAbbr },
      update: {
        stateAbbr,
        verificationToken: crypto.randomUUID(),
      },
    });

    // Send verification email
    if (resend) {
      const { subject, html } = buildVerificationEmail(
        stateAbbr,
        subscriber.verificationToken
      );
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject,
        html,
      });
    }

    return Response.json({
      success: true,
      message: "Check your email to confirm your subscription.",
      profileToken: subscriber.profileToken,
    });
  } catch (error) {
    console.error("[subscribe] Error:", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
