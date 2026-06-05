#!/usr/bin/env node
/**
 * Bulk-transform API routes to use withErrorHandler / withCronErrorHandler.
 * Run: node scripts/wrap-api-routes.mjs
 */

import { readFileSync, writeFileSync } from "fs";

const ROUTES = [
  // Public data APIs
  { file: "src/app/api/search/route.ts", method: "GET", route: "GET /api/search", isCron: false },
  { file: "src/app/api/bills/route.ts", method: "GET", route: "GET /api/bills", isCron: false },
  { file: "src/app/api/candidates/route.ts", method: "GET", route: "GET /api/candidates", isCron: false },
  { file: "src/app/api/agencies/route.ts", method: "GET", route: "GET /api/agencies", isCron: false },
  { file: "src/app/api/pac-recipients/route.ts", method: "GET", route: "GET /api/pac-recipients", isCron: false },
  // Civic / local APIs
  { file: "src/app/api/district-lookup/route.ts", method: "GET", route: "GET /api/district-lookup", isCron: false },
  { file: "src/app/api/polling-places/route.ts", method: "GET", route: "GET /api/polling-places", isCron: false },
  { file: "src/app/api/local/municipality/route.ts", method: "GET", route: "GET /api/local/municipality", isCron: false },
  { file: "src/app/api/local/meetings/route.ts", method: "GET", route: "GET /api/local/meetings", isCron: false },
  { file: "src/app/api/local/meeting/[id]/route.ts", method: "GET", route: "GET /api/local/meeting/:id", isCron: false },
  { file: "src/app/api/local/meetings/submit/route.ts", method: "POST", route: "POST /api/local/meetings/submit", isCron: false },
  { file: "src/app/api/local/template/route.ts", method: "POST", route: "POST /api/local/template", isCron: false },
  // AI APIs
  { file: "src/app/api/ai/analyze-bill/route.ts", method: "POST", route: "POST /api/ai/analyze-bill", isCron: false },
  { file: "src/app/api/ai/analyze-candidate/route.ts", method: "POST", route: "POST /api/ai/analyze-candidate", isCron: false },
  // SCOTUS APIs
  { file: "src/app/api/scotus/cases/route.ts", method: "GET", route: "GET /api/scotus/cases", isCron: false },
  { file: "src/app/api/scotus/justices/route.ts", method: "GET", route: "GET /api/scotus/justices", isCron: false },
  // Subscription APIs
  { file: "src/app/api/subscribe/route.ts", method: "POST", route: "POST /api/subscribe", isCron: false },
  { file: "src/app/api/subscribe/verify/route.ts", method: "GET", route: "GET /api/subscribe/verify", isCron: false },
  { file: "src/app/api/subscribe/demographics/route.ts", method: "POST", route: "POST /api/subscribe/demographics", isCron: false },
  { file: "src/app/api/unsubscribe/route.ts", method: "GET", route: "GET/POST /api/unsubscribe", isCron: false, hasMultipleMethods: true },
  // Cron jobs
  { file: "src/app/api/cron/sync-scotus/route.ts", method: "GET", route: "GET /api/cron/sync-scotus", isCron: true, jobName: "sync-scotus" },
  { file: "src/app/api/cron/sync-members/route.ts", method: "GET", route: "GET /api/cron/sync-members", isCron: true, jobName: "sync-members" },
  { file: "src/app/api/cron/sync-bills/route.ts", method: "GET", route: "GET /api/cron/sync-bills", isCron: true, jobName: "sync-bills" },
  { file: "src/app/api/cron/sync-votes/route.ts", method: "GET", route: "GET /api/cron/sync-votes", isCron: true, jobName: "sync-votes" },
  { file: "src/app/api/cron/sync-campaign-finance/route.ts", method: "GET", route: "GET /api/cron/sync-campaign-finance", isCron: true, jobName: "sync-campaign-finance" },
  { file: "src/app/api/cron/sync-elections/route.ts", method: "GET", route: "GET /api/cron/sync-elections", isCron: true, jobName: "sync-elections" },
  { file: "src/app/api/cron/sync-voter-info/route.ts", method: "GET", route: "GET /api/cron/sync-voter-info", isCron: true, jobName: "sync-voter-info" },
  { file: "src/app/api/cron/sync-pac-contributions/route.ts", method: "GET", route: "GET /api/cron/sync-pac-contributions", isCron: true, jobName: "sync-pac-contributions" },
  { file: "src/app/api/cron/sync-local-meetings/route.ts", method: "GET", route: "GET /api/cron/sync-local-meetings", isCron: true, jobName: "sync-local-meetings" },
  { file: "src/app/api/cron/analyze-bills/route.ts", method: "GET", route: "GET /api/cron/analyze-bills", isCron: true, jobName: "analyze-bills" },
  { file: "src/app/api/cron/analyze-candidates/route.ts", method: "GET", route: "GET /api/cron/analyze-candidates", isCron: true, jobName: "analyze-candidates" },
  { file: "src/app/api/cron/analyze-cases/route.ts", method: "GET", route: "GET /api/cron/analyze-cases", isCron: true, jobName: "analyze-cases" },
  { file: "src/app/api/cron/send-digest/route.ts", method: "GET", route: "GET /api/cron/send-digest", isCron: true, jobName: "send-digest" },
];

const IMPORT_LINE = 'import { withErrorHandler, ValidationError, NotFoundError } from "@/lib/api-error-handler";';
const CRON_IMPORT_LINE = 'import { withCronErrorHandler, ValidationError, NotFoundError } from "@/lib/api-error-handler";';

let modified = 0;
let skipped = 0;
let errors = [];

for (const r of ROUTES) {
  try {
    let content = readFileSync(r.file, "utf-8");

    // Skip if already wrapped
    if (content.includes("withErrorHandler") || content.includes("withCronErrorHandler")) {
      console.log(`SKIP (already wrapped): ${r.file}`);
      skipped++;
      continue;
    }

    // Determine which HOF to use
    const hofName = r.isCron ? "withCronErrorHandler" : "withErrorHandler";
    const importLine = r.isCron ? CRON_IMPORT_LINE : IMPORT_LINE;

    // Insert import after the last import line
    const lastImportMatch = content.match(/^(import .+;)$/gm);
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      content = content.replace(lastImport, lastImport + "\n" + importLine);
    } else {
      content = importLine + "\n" + content;
    }

    // Replace "export async function METHOD(request: Request) {" 
    // with "export const METHOD = withErrorHandler(async (request: Request) => {"
    const funcPattern = new RegExp(
      `export async function ${r.method}\\(request:\\s*Request\\)\\s*\\{`,
      "g"
    );
    
    const options = r.isCron
      ? `{ route: "${r.route}", jobName: "${r.jobName}" }`
      : `{ route: "${r.route}" }`;

    content = content.replace(
      funcPattern,
      `export const ${r.method} = ${hofName}(async (request: Request) => {`
    );

    // Find the matching closing brace for the outer function and append the HOF call
    // This is heuristic: we look for the last "}" before any trailing comments/exports
    // and replace it with "}, OPTIONS);"
    
    // Actually, let's be smarter. The outer try/catch pattern means the function ends with:
    //   } catch (error) {
    //     ...
    //   }
    // }
    // We want to remove the outer try/catch and close with "}, OPTIONS);"
    
    // Pattern: outer try { ... } catch (...) { ... } at the end of the function
    const outerCatchPattern = /\}\s*catch\s*\(\s*\w+\s*\)\s*\{[\s\S]*?\n\}\s*\n?\}$/;
    if (outerCatchPattern.test(content)) {
      content = content.replace(outerCatchPattern, `}, ${options});`);
    } else {
      // No outer catch — just replace the final "}" with "}, OPTIONS);"
      // Find the last standalone "}" that closes the function
      const lines = content.split("\n");
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim() === "}") {
          lines[i] = `}, ${options});`;
          break;
        }
      }
      content = lines.join("\n");
    }

    // Replace Response.json({ error: "..." }, { status: 400 }) with throw new ValidationError("...")
    content = content.replace(
      /return Response\.json\(\s*\{\s*error:\s*"([^"]+)"\s*\}\s*,\s*\{\s*status:\s*400\s*\}\s*\)/g,
      'throw new ValidationError("$1")'
    );

    // Replace Response.json({ error: "..." }, { status: 404 }) with throw new NotFoundError("...")
    content = content.replace(
      /return Response\.json\(\s*\{\s*error:\s*"([^"]+)"\s*\}\s*,\s*\{\s*status:\s*404\s*\}\s*\)/g,
      'throw new NotFoundError("$1")'
    );

    writeFileSync(r.file, content);
    console.log(`MODIFIED: ${r.file}`);
    modified++;
  } catch (err) {
    console.error(`ERROR on ${r.file}: ${err.message}`);
    errors.push({ file: r.file, error: err.message });
  }
}

console.log(`\nDone. Modified: ${modified}, Skipped: ${skipped}, Errors: ${errors.length}`);
if (errors.length > 0) {
  console.error("\nErrors:");
  errors.forEach(e => console.error(`  ${e.file}: ${e.error}`));
}
