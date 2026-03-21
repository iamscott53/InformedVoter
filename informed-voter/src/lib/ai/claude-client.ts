import Anthropic from "@anthropic-ai/sdk";
import { PolicyCategory, VoteChoice } from "@/types";

// ─────────────────────────────────────────────
// Client initialisation
// ─────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─────────────────────────────────────────────
// Response types
// ─────────────────────────────────────────────

export interface BillAnalysis {
  executive_summary: string;
  detailed_summary: string;
  key_provisions: string[];
  affected_groups: string[];
  fiscal_impact: string;
  political_context: string;
}

export interface RiderDetectionResult {
  has_riders: boolean;
  riders: Array<{
    title: string;
    description: string;
    concern_level: "low" | "medium" | "high";
    page_reference?: string;
  }>;
  summary: string;
}

export interface CandidatePolicyAnalysis {
  category: PolicyCategory;
  summary: string;
  supporters_perspective: string;
  critics_perspective: string;
  key_votes: Array<{
    bill: string;
    vote: string;
    significance: string;
  }>;
  consistency_score: number; // 0-100
  notes: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Parse the first JSON object or array found in a string.
 * Handles Claude responses that wrap JSON in markdown code fences.
 */
function extractJson<T>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenceMatch ? fenceMatch[1] : text;
  return JSON.parse(raw.trim()) as T;
}

function getTextContent(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text content in Claude response");
  }
  return block.text;
}

// ─────────────────────────────────────────────
// analyzeBill
// ─────────────────────────────────────────────

/**
 * Produce a plain-language analysis of a legislative bill using Claude Haiku.
 */
export async function analyzeBill(
  title: string,
  text: string
): Promise<BillAnalysis> {
  const prompt = `You are a nonpartisan legislative analyst. Analyze the following bill and provide a clear, objective summary for everyday citizens.

Bill Title: ${title}

Bill Text:
${text.slice(0, 15000)}${text.length > 15000 ? "\n\n[Text truncated for brevity]" : ""}

Respond with a JSON object matching this exact structure:
{
  "executive_summary": "2-3 sentence plain-language summary",
  "detailed_summary": "1-2 paragraph detailed explanation",
  "key_provisions": ["provision 1", "provision 2", "..."],
  "affected_groups": ["group 1", "group 2", "..."],
  "fiscal_impact": "Brief description of estimated cost or savings",
  "political_context": "Objective description of political background"
}

Be factual and nonpartisan. Do not editorialize or take sides.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return extractJson<BillAnalysis>(getTextContent(message));
}

// ─────────────────────────────────────────────
// detectRiders
// ─────────────────────────────────────────────

/**
 * Detect unrelated "rider" provisions in a bill using Claude Sonnet.
 */
export async function detectRiders(
  title: string,
  summary: string,
  text: string
): Promise<RiderDetectionResult> {
  const prompt = `You are an expert legislative analyst specializing in identifying "riders" — provisions attached to a bill that are unrelated to its primary purpose.

Bill Title: ${title}

Bill Summary: ${summary}

Bill Text:
${text.slice(0, 20000)}${text.length > 20000 ? "\n\n[Text truncated for brevity]" : ""}

Analyze the bill text carefully and identify any provisions that:
1. Are unrelated or loosely related to the bill's primary stated purpose
2. Would not pass on their own merit as standalone legislation
3. Significantly expand the bill's scope beyond its title or summary

Respond with a JSON object matching this exact structure:
{
  "has_riders": true | false,
  "riders": [
    {
      "title": "Short name for the rider",
      "description": "What this provision does and why it appears unrelated",
      "concern_level": "low" | "medium" | "high",
      "page_reference": "Section or page reference if available"
    }
  ],
  "summary": "1-2 sentence overview of your findings"
}

If no riders are found, return an empty array for "riders" and set "has_riders" to false.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  return extractJson<RiderDetectionResult>(getTextContent(message));
}

// ─────────────────────────────────────────────
// analyzeCandidatePolicy
// ─────────────────────────────────────────────

export interface CandidatePolicyInput {
  name: string;
  party: string;
  office: string;
  category: PolicyCategory;
  votes: Array<{ bill: string; vote: VoteChoice; date?: string }>;
  statements: string[];
}

/**
 * Produce a balanced, nonpartisan policy analysis for a candidate on a given topic.
 */
export async function analyzeCandidatePolicy(
  input: CandidatePolicyInput
): Promise<CandidatePolicyAnalysis> {
  const { name, party, office, category, votes, statements } = input;

  const voteSummary =
    votes.length > 0
      ? votes
          .map(
            (v) =>
              `- ${v.bill}: ${v.vote}${v.date ? ` (${v.date})` : ""}`
          )
          .join("\n")
      : "No recorded votes available.";

  const statementSummary =
    statements.length > 0
      ? statements.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : "No public statements available.";

  const prompt = `You are a nonpartisan political analyst. Analyze ${name}'s (${party}, ${office}) position on ${category.replace(/_/g, " ").toLowerCase()} policy.

Voting Record:
${voteSummary}

Public Statements:
${statementSummary}

Provide a balanced, factual analysis that presents both how supporters and critics view this candidate's positions. Do not take sides.

Respond with a JSON object matching this exact structure:
{
  "category": "${category}",
  "summary": "2-3 sentence objective summary of their overall position",
  "supporters_perspective": "1-2 sentences on how supporters view their record",
  "critics_perspective": "1-2 sentences on how critics view their record",
  "key_votes": [
    {
      "bill": "Bill name or number",
      "vote": "YES | NO | ABSTAIN | NOT_VOTING",
      "significance": "Why this vote matters"
    }
  ],
  "consistency_score": 0-100,
  "notes": "Any additional context or caveats"
}

The consistency_score (0-100) reflects how consistently their votes align with their stated positions — it is not a quality judgment.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return extractJson<CandidatePolicyAnalysis>(getTextContent(message));
}
