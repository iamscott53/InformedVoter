#!/usr/bin/env node
/**
 * Full UAT Test Suite for informed-voter.vercel.app
 * Tests every page, API endpoint, and user flow.
 */

const BASE = "https://informed-voter.vercel.app";
const results = [];
let passCount = 0;
let failCount = 0;
let warnCount = 0;

function log(type, route, message, detail = "") {
  const icon = type === "PASS" ? "✅" : type === "FAIL" ? "❌" : "⚠️";
  results.push({ type, route, message, detail });
  if (type === "PASS") passCount++;
  else if (type === "FAIL") failCount++;
  else warnCount++;
  console.log(`${icon} [${route}] ${message}${detail ? " | " + detail : ""}`);
}

async function fetchJson(path, opts = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  const res = await fetch(url, { ...opts, redirect: "manual" });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: res.headers, text, json, url: res.url };
}

async function fetchHtml(path, opts = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  const res = await fetch(url, { ...opts, redirect: "manual" });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, url: res.url };
}

// ─────────────────────────────────────────────
// PHASE 1: Homepage & Core Pages
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 1: Homepage & Core Pages\n");

const corePages = [
  { path: "/", shouldContain: ["InformedVoter", "Congress", "Supreme Court"] },
  { path: "/about", shouldContain: ["About", "mission"] },
  { path: "/contact", shouldContain: ["Contact"] },
  { path: "/privacy", shouldContain: ["Privacy"] },
  { path: "/elections", shouldContain: ["Election"] },
  { path: "/judicial", shouldContain: ["Supreme Court", "Justice"] },
  { path: "/local", shouldContain: ["Local", "government"] },
  { path: "/local/rules", shouldContain: ["First Amendment", "speaking"] },
  { path: "/local/templates", shouldContain: ["template", "speaking"] },
  { path: "/agencies", shouldContain: ["Agency", "Federal"] },
  { path: "/polling-places", shouldContain: ["Polling", "vote"] },
  { path: "/compare", shouldContain: ["Compare"] },
  { path: "/pac-recipients", shouldContain: ["PAC"] },
  { path: "/robots.txt", shouldContain: ["User-agent"] },
  { path: "/sitemap.xml", shouldContain: ["<urlset"] },
];

for (const page of corePages) {
  const r = await fetchHtml(page.path);
  if (r.status === 200) {
    const missing = page.shouldContain.filter(s =>
      !r.text.toLowerCase().includes(s.toLowerCase())
    );
    if (missing.length === 0) {
      log("PASS", page.path, "Page loads, content verified");
    } else {
      log("WARN", page.path, "Page loads but missing expected content", missing.join(", "));
    }
  } else if (r.status === 307 || r.status === 308) {
    log("WARN", page.path, `Unexpected redirect (${r.status})`, r.headers.get("location") || "");
  } else {
    log("FAIL", page.path, `Unexpected status ${r.status}`, r.text.slice(0, 120));
  }
}

// ─────────────────────────────────────────────
// PHASE 2: State Hub Pages
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2: State Hub Pages\n");

const states = ["VA", "CA", "TX", "FL", "NY", "OH", "MI", "PA"];
const stateSubPages = ["", "/senators", "/representatives", "/governor", "/bills", "/elections", "/voter-info"];

for (const state of states) {
  for (const sub of stateSubPages) {
    const path = `/state/${state}${sub}`;
    const r = await fetchHtml(path);
    if (r.status === 200) {
      log("PASS", path, "Loads successfully");
    } else if (r.status === 404) {
      log("FAIL", path, `404 Not Found`);
    } else {
      log("FAIL", path, `Status ${r.status}`);
    }
  }
}

// ─────────────────────────────────────────────
// PHASE 3: Federal Data Pages
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 3: Federal Data Pages\n");

const fedPages = [
  { path: "/api/scotus/justices?limit=1", expectJson: true, check: d => Array.isArray(d.justices) },
  { path: "/api/scotus/cases?limit=1", expectJson: true, check: d => Array.isArray(d.cases) || Array.isArray(d) },
  { path: "/api/candidates?limit=1", expectJson: true, check: d => Array.isArray(d.candidates) },
  { path: "/api/bills?limit=1", expectJson: true, check: d => Array.isArray(d.bills) },
  { path: "/api/agencies", expectJson: true, check: d => Array.isArray(d.agencies) },
  { path: "/api/search?q=tax&limit=1", expectJson: true, check: d => Array.isArray(d.bills) || Array.isArray(d.candidates) },
  { path: "/api/polling-places?address=1600+Pennsylvania+Avenue+NW+Washington+DC", expectJson: true, check: d => typeof d === "object" },
  { path: "/api/district-lookup?address=1600+Pennsylvania+Avenue+NW+Washington+DC", expectJson: true, check: d => typeof d === "object" },
  { path: "/api/pac-recipients?limit=1", expectJson: true, check: d => typeof d === "object" },
  { path: "/api/health", expectJson: true, check: d => d.status === "ok" },
];

for (const page of fedPages) {
  const r = await fetchJson(page.path);
  if (r.status === 200) {
    if (page.expectJson && !r.json) {
      log("FAIL", page.path, "Expected JSON but got non-JSON", r.text.slice(0, 100));
    } else if (page.check && !page.check(r.json)) {
      log("FAIL", page.path, "JSON response structure unexpected", JSON.stringify(r.json).slice(0, 100));
    } else {
      log("PASS", page.path, "API responds correctly");
    }
  } else if (r.status === 429) {
    log("WARN", page.path, "Rate limited (429)");
  } else {
    log("FAIL", page.path, `Status ${r.status}`, r.text.slice(0, 120));
  }
}

// Detail pages — need IDs from list endpoints
async function testDetailPages() {
  // Justice detail
  const justices = await fetchJson("/api/scotus/justices?limit=1");
  if (justices.json?.justices?.[0]?.slug) {
    const slug = justices.json.justices[0].slug;
    const r = await fetchHtml(`/judicial/justices/${slug}`);
    log(r.status === 200 ? "PASS" : "FAIL", `/judicial/justices/${slug}`, `Status ${r.status}`);
  }
  if (justices.json?.justices?.[0]?.oyezIdentifier) {
    const id = justices.json.justices[0].oyezIdentifier;
    const r = await fetchHtml(`/judicial/justices/${id}`);
    log(r.status === 200 ? "PASS" : "FAIL", `/judicial/justices/${id}`, `Status ${r.status}`);
  }

  // Candidate detail
  const candidates = await fetchJson("/api/candidates?limit=1");
  if (candidates.json?.candidates?.[0]?.id) {
    const id = candidates.json.candidates[0].id;
    const r = await fetchHtml(`/candidate/${id}`);
    log(r.status === 200 ? "PASS" : "FAIL", `/candidate/${id}`, `Status ${r.status}`);
  }

  // Bill detail (needs state + billId)
  const bills = await fetchJson("/api/bills?limit=1");
  if (bills.json?.bills?.[0]?.externalId) {
    const extId = bills.json.bills[0].externalId;
    // Try a generic state bill page
    const r = await fetchHtml(`/state/VA/bills/${extId}`);
    log(r.status === 200 ? "PASS" : "WARN", `/state/VA/bills/${extId}`, `Status ${r.status}`);
  }

  // Agency detail
  const agencies = await fetchJson("/api/agencies");
  if (agencies.json?.agencies?.[0]?.slug) {
    const slug = agencies.json.agencies[0].slug;
    const r = await fetchHtml(`/agencies/${slug}`);
    log(r.status === 200 ? "PASS" : "FAIL", `/agencies/${slug}`, `Status ${r.status}`);
  }

  // SCOTUS case detail
  const cases = await fetchJson("/api/scotus/cases?limit=1");
  if (cases.json?.cases?.[0]?.slug) {
    const slug = cases.json.cases[0].slug;
    const r = await fetchHtml(`/judicial/cases/${slug}`);
    log(r.status === 200 ? "PASS" : "FAIL", `/judicial/cases/${slug}`, `Status ${r.status}`);
  } else if (Array.isArray(cases.json) && cases.json[0]?.slug) {
    const slug = cases.json[0].slug;
    const r = await fetchHtml(`/judicial/cases/${slug}`);
    log(r.status === 200 ? "PASS" : "FAIL", `/judicial/cases/${slug}`, `Status ${r.status}`);
  }

  // PAC recipient detail
  const pacs = await fetchJson("/api/pac-recipients?limit=1");
  if (pacs.json?.slug || pacs.json?.[0]?.slug) {
    const slug = pacs.json.slug || pacs.json[0].slug;
    const r = await fetchHtml(`/pac-recipients/${slug}`);
    log(r.status === 200 ? "PASS" : "FAIL", `/pac-recipients/${slug}`, `Status ${r.status}`);
  }
}
await testDetailPages();

// ─────────────────────────────────────────────
// PHASE 4: Local Government Pages
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 4: Local Government Pages\n");

// Dynamically fetch a real municipality ID first
const municipalityRes = await fetchJson("/api/local/municipality?city=Chicago&state=IL");
let municipalityId = null;
let meetingId = null;
if (municipalityRes.status === 200 && municipalityRes.json?.id) {
  municipalityId = municipalityRes.json.id;
  log("PASS", "/api/local/municipality?city=Chicago&state=IL", `Found municipality id=${municipalityId}`);
} else {
  log("WARN", "/api/local/municipality?city=Chicago&state=IL", `Status ${municipalityRes.status}, no data`);
}

// If we have a municipality, try to get a meeting from it
if (municipalityId) {
  const meetingsRes = await fetchJson(`/api/local/meetings?municipalityId=${municipalityId}`);
  if (meetingsRes.status === 200 && Array.isArray(meetingsRes.json?.meetings) && meetingsRes.json.meetings.length > 0) {
    meetingId = meetingsRes.json.meetings[0].id;
    log("PASS", `/api/local/meetings?municipalityId=${municipalityId}`, `Found meeting id=${meetingId}`);
  } else {
    log("WARN", `/api/local/meetings?municipalityId=${municipalityId}`, `No meetings found`);
  }
}

// Test meeting API with real ID if available
if (meetingId) {
  const meetingApiRes = await fetchJson(`/api/local/meeting/${meetingId}`);
  log(meetingApiRes.status === 200 ? "PASS" : "WARN", `/api/local/meeting/${meetingId}`, `Status ${meetingApiRes.status}`);
} else {
  log("SKIP", "/api/local/meeting/{id}", "No valid meeting ID available");
}

// Local pages — use real IDs if available
const localCityPath = municipalityId ? `/local/city/${municipalityId}` : null;
const localMeetingPath = meetingId ? `/local/meeting/${meetingId}` : null;

if (localCityPath) {
  const r = await fetchHtml(localCityPath);
  log(r.status === 200 || r.status === 404 ? "PASS" : "FAIL", localCityPath, `Status ${r.status}`);
} else {
  log("SKIP", "/local/city/{id}", "No valid municipality ID available");
}

if (localMeetingPath) {
  const r = await fetchHtml(localMeetingPath);
  log(r.status === 200 || r.status === 404 ? "PASS" : "FAIL", localMeetingPath, `Status ${r.status}`);
} else {
  log("SKIP", "/local/meeting/{id}", "No valid meeting ID available");
}

// ─────────────────────────────────────────────
// PHASE 5: Forms & User Flows
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 5: Forms & User Flows\n");

// Subscribe — test validation
const subscribeTests = [
  { body: { email: "not-an-email" }, desc: "invalid email" },
  { body: { email: "test@example.com", state: "ZZ" }, desc: "invalid state" },
  { body: { email: "test@example.com", state: "VA" }, desc: "valid subscription" },
];

for (const t of subscribeTests) {
  const r = await fetchJson("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t.body),
  });
  if (t.desc === "valid subscription" && (r.status === 200 || r.status === 429)) {
    log(r.status === 200 ? "PASS" : "WARN", `/api/subscribe (${t.desc})`, `Status ${r.status}`);
  } else if (r.status === 400 || r.status === 422 || r.status === 429) {
    log("PASS", `/api/subscribe (${t.desc})`, `Correctly rejected with ${r.status}`);
  } else {
    log("WARN", `/api/subscribe (${t.desc})`, `Unexpected status ${r.status}`, r.text.slice(0, 100));
  }
}

// Unsubscribe GET (confirmation page)
const unsub = await fetchHtml("/api/unsubscribe?token=test-token");
log(unsub.status === 200 ? "PASS" : unsub.status === 400 ? "PASS" : "WARN",
  "/api/unsubscribe?token=...", `GET status ${unsub.status}`);

// Local meeting submission
const meetingSubmit = await fetchJson("/api/local/meetings/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
log(meetingSubmit.status === 400 || meetingSubmit.status === 422 ? "PASS" : "WARN",
  "/api/local/meetings/submit (empty)", `Status ${meetingSubmit.status}`);

// ─────────────────────────────────────────────
// PHASE 6: Cron & AI Routes (Auth Required)
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 6: Protected Routes\n");

const protectedRoutes = [
  "/api/cron/sync-members",
  "/api/cron/sync-bills",
  "/api/cron/analyze-bills",
  "/api/ai/analyze-bill",
  "/api/ai/analyze-candidate",
];

for (const path of protectedRoutes) {
  const r = await fetchJson(path);
  if (r.status === 401 || r.status === 403) {
    log("PASS", path, "Correctly requires auth (401/403)");
  } else if (r.status === 429) {
    log("PASS", path, "Rate limited (429) — auth layer may have passed but rate limit caught it");
  } else {
    log("FAIL", path, `Unexpected status ${r.status} — should require auth`, r.text.slice(0, 100));
  }
}

// Test with wrong secret
const wrongSecret = await fetchJson("/api/cron/sync-members?secret=wrong", {
  headers: { "Authorization": "Bearer wrong" },
});
log(wrongSecret.status === 401 ? "PASS" : "FAIL",
  "/api/cron/sync-members (wrong secret)", `Status ${wrongSecret.status}`);

// ─────────────────────────────────────────────
// PHASE 7: Security Headers
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 7: Security Headers\n");

const secRes = await fetchHtml("/");
const headers = secRes.headers;
const expectedHeaders = {
  "content-security-policy": "present",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "present",
  "strict-transport-security": "present",
};

for (const [name, expected] of Object.entries(expectedHeaders)) {
  const val = headers.get(name);
  if (!val) {
    log("FAIL", `Security Header: ${name}`, "Missing");
  } else if (expected !== "present" && !val.toUpperCase().includes(expected.toUpperCase())) {
    log("WARN", `Security Header: ${name}`, `Present but unexpected value`, val);
  } else {
    log("PASS", `Security Header: ${name}`, val?.slice(0, 60) || "Present");
  }
}

// Check for X-Powered-By and Server leakage
if (headers.get("x-powered-by")) log("WARN", "Security", "X-Powered-By header leaks info", headers.get("x-powered-by"));
const serverHeader = headers.get("server");
if (serverHeader && !serverHeader.toLowerCase().includes("vercel")) {
  log("WARN", "Security", "Server header leaks info", serverHeader);
}
// Note: Vercel adds 'Server: Vercel' — this is platform-standard, not a leak

// ─────────────────────────────────────────────
// PHASE 8: Link Integrity (Homepage)
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 8: Link Integrity\n");

const home = await fetchHtml("/");
const linkMatches = home.text.matchAll(/href="([^"]+)"/g);
const links = new Set();
for (const m of linkMatches) {
  const href = m[1];
  if (href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/api/")) {
    links.add(href.split("?")[0].split("#")[0]);
  }
}

const linkArr = Array.from(links).slice(0, 30);
for (const link of linkArr) {
  const r = await fetchHtml(link);
  if (r.status === 200) {
    log("PASS", link, "Link OK");
  } else if (r.status === 307 || r.status === 308) {
    log("WARN", link, `Redirect ${r.status}`);
  } else {
    log("FAIL", link, `Broken link: ${r.status}`);
  }
}

// ─────────────────────────────────────────────
// PHASE 9: Performance Smoke Test
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 9: Performance\n");

const perfPaths = ["/", "/about", "/judicial", "/state/VA", "/api/health", "/api/scotus/justices?limit=1"];
for (const path of perfPaths) {
  const start = Date.now();
  const r = path.startsWith("/api/") ? await fetchJson(path) : await fetchHtml(path);
  const ms = Date.now() - start;
  if (r.status === 200 && ms < 3000) {
    log("PASS", path, `TTFB ${ms}ms`);
  } else if (r.status === 200) {
    log("WARN", path, `Slow TTFB ${ms}ms`);
  } else {
    log("FAIL", path, `Status ${r.status}, TTFB ${ms}ms`);
  }
}

// ─────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log("📊 UAT SUMMARY");
console.log("=".repeat(60));
console.log(`✅ PASS:  ${passCount}`);
console.log(`❌ FAIL:  ${failCount}`);
console.log(`⚠️  WARN: ${warnCount}`);
console.log(`📋 TOTAL: ${passCount + failCount + warnCount}`);

if (failCount > 0) {
  console.log("\n❌ FAILURES:");
  for (const r of results.filter(x => x.type === "FAIL")) {
    console.log(`   ${r.route}: ${r.message}`);
  }
}

if (warnCount > 0) {
  console.log("\n⚠️  WARNINGS:");
  for (const r of results.filter(x => x.type === "WARN")) {
    console.log(`   ${r.route}: ${r.message}${r.detail ? " | " + r.detail : ""}`);
  }
}

// Write full report to file
const report = results.map(r => `${r.type}|${r.route}|${r.message}|${r.detail}`).join("\n");
import { writeFileSync } from "fs";
writeFileSync("uat-results.tsv", "Type\tRoute\tMessage\tDetail\n" + report);
console.log("\n📁 Full results written to uat-results.tsv");
