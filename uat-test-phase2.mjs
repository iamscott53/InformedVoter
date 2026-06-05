#!/usr/bin/env node
/**
 * UAT Phase 2: Deep-dive tests for images, forms, structured data,
 * error pages, CORS, and edge cases.
 */

const BASE = "https://informed-voter.vercel.app";
const results = [];
let passCount = 0, failCount = 0, warnCount = 0;

function log(type, route, message, detail = "") {
  const icon = type === "PASS" ? "✅" : type === "FAIL" ? "❌" : "⚠️";
  results.push({ type, route, message, detail });
  if (type === "PASS") passCount++;
  else if (type === "FAIL") failCount++;
  else warnCount++;
  console.log(`${icon} [${route}] ${message}${detail ? " | " + detail : ""}`);
}

async function fetchHtml(path, opts = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  const res = await fetch(url, { ...opts, redirect: "manual" });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text, url: res.url };
}

async function fetchJson(path, opts = {}) {
  const url = path.startsWith("http") ? path : BASE + path;
  const res = await fetch(url, { ...opts, redirect: "manual" });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: res.headers, text, json, url: res.url };
}

// ─────────────────────────────────────────────
// PHASE 2a: Image Integrity
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2a: Image Integrity\n");

const justicePage = await fetchHtml("/judicial");
const imgMatches = justicePage.text.matchAll(/src="(https?:\/\/[^"]+)"/g);
const imageUrls = new Set();
for (const m of imgMatches) {
  const url = m[1];
  if (url.includes("oyez.org") || url.includes("bioguide.congress.gov") || url.includes("theunitedstates.io")) {
    imageUrls.add(url);
  }
}

// Test a sample of external images
const sampleImages = Array.from(imageUrls).slice(0, 8);
for (const imgUrl of sampleImages) {
  try {
    const res = await fetch(imgUrl, { method: "HEAD", redirect: "follow" });
    const ct = res.headers.get("content-type") || "";
    if (res.status === 200 && ct.startsWith("image/")) {
      log("PASS", new URL(imgUrl).pathname, "Image reachable", ct);
    } else if (res.status === 200) {
      log("WARN", new URL(imgUrl).pathname, "Non-image content-type", ct);
    } else if (res.status === 403) {
      log("WARN", new URL(imgUrl).pathname, "Image blocked (403)", ct);
    } else {
      log("FAIL", new URL(imgUrl).pathname, `Image broken: ${res.status}`);
    }
  } catch (e) {
    log("FAIL", new URL(imgUrl).pathname, `Image fetch error: ${e.message}`);
  }
}

// ─────────────────────────────────────────────
// PHASE 2b: 404 Page & Error Boundary
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2b: 404 & Error Pages\n");

const notFound = await fetchHtml("/this-page-does-not-exist-12345");
if (notFound.status === 404) {
  if (notFound.text.toLowerCase().includes("not found") || notFound.text.includes("404")) {
    log("PASS", "/nonexistent", "Custom 404 page rendered");
  } else {
    log("WARN", "/nonexistent", "404 status but no obvious 404 content");
  }
} else {
  log("FAIL", "/nonexistent", `Expected 404, got ${notFound.status}`);
}

// Test API 404
const api404 = await fetchJson("/api/nonexistent-route");
log(api404.status === 404 ? "PASS" : "WARN", "/api/nonexistent-route", `Status ${api404.status}`);

// ─────────────────────────────────────────────
// PHASE 2c: CORS Headers on API Routes
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2c: CORS Headers\n");

const corsPaths = ["/api/health", "/api/bills?limit=1", "/api/candidates?limit=1"];
for (const path of corsPaths) {
  const r = await fetchJson(path, {
    headers: { "Origin": "https://example.com" },
  });
  const acao = r.headers.get("access-control-allow-origin");
  if (acao) {
    log("PASS", path, `CORS header present: ${acao}`);
  } else {
    log("WARN", path, "No Access-Control-Allow-Origin header");
  }
}

// Test OPTIONS preflight
const optionsTest = await fetch(BASE + "/api/health", { method: "OPTIONS", headers: { "Origin": "https://example.com", "Access-Control-Request-Method": "GET" } });
if (optionsTest.status === 204 || optionsTest.status === 200) {
  log("PASS", "OPTIONS /api/health", `Preflight status ${optionsTest.status}`);
} else {
  log("WARN", "OPTIONS /api/health", `Unexpected preflight status ${optionsTest.status}`);
}

// ─────────────────────────────────────────────
// PHASE 2d: Structured Data (JSON-LD)
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2d: Structured Data\n");

const pagesForLd = ["/", "/about", "/judicial", "/state/VA"];
for (const path of pagesForLd) {
  const r = await fetchHtml(path);
  const ldMatch = r.text.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch) {
    try {
      const ld = JSON.parse(ldMatch[1]);
      if (ld["@context"] && ld["@type"]) {
        log("PASS", path, `Valid JSON-LD: ${ld["@type"]}`);
      } else {
        log("WARN", path, "JSON-LD missing @context or @type");
      }
    } catch {
      log("FAIL", path, "Malformed JSON-LD");
    }
  } else {
    log("WARN", path, "No JSON-LD found");
  }
}

// ─────────────────────────────────────────────
// PHASE 2e: Meta Tags (SEO)
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2e: Meta Tags\n");

const seoPages = ["/", "/about", "/state/VA", "/judicial"];
for (const path of seoPages) {
  const r = await fetchHtml(path);
  const title = r.text.match(/<title>([^<]*)<\/title>/i);
  const desc = r.text.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  const ogTitle = r.text.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
  const viewport = r.text.match(/<meta[^>]*name="viewport"[^>]*>/i);
  
  if (!title) log("FAIL", path, "Missing <title> tag");
  else if (title[1].length < 5) log("WARN", path, "Title too short", title[1]);
  else log("PASS", path, `Title: ${title[1].slice(0, 50)}`);
  
  if (!desc) log("WARN", path, "Missing meta description");
  else log("PASS", path + " [desc]", `Description present (${desc[1].length} chars)`);
  
  if (!ogTitle) log("WARN", path, "Missing og:title");
  else log("PASS", path + " [og]", "Open Graph title present");
  
  if (!viewport) log("FAIL", path, "Missing viewport meta tag");
  else log("PASS", path + " [viewport]", "Viewport present");
}

// ─────────────────────────────────────────────
// PHASE 2f: Form Edge Cases
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2f: Form Edge Cases\n");

// Subscribe with SQL injection attempt
const sqlInject = await fetchJson("/api/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test' OR '1'='1@test.com", state: "VA" }),
});
log(sqlInject.status === 400 || sqlInject.status === 422 ? "PASS" : "WARN",
  "/api/subscribe (SQLi attempt)", `Status ${sqlInject.status}`);

// Subscribe with XSS attempt
const xssAttempt = await fetchJson("/api/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "<script>alert(1)</script>@test.com", state: "VA" }),
});
log(xssAttempt.status === 400 || xssAttempt.status === 422 ? "PASS" : "WARN",
  "/api/subscribe (XSS attempt)", `Status ${xssAttempt.status}`);

// Subscribe with extremely long email
const longEmail = "a".repeat(300) + "@test.com";
const longEmailTest = await fetchJson("/api/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: longEmail, state: "VA" }),
});
log(longEmailTest.status === 400 || longEmailTest.status === 422 ? "PASS" : "WARN",
  "/api/subscribe (long email)", `Status ${longEmailTest.status}`);

// Local meeting submit with XSS
const localXss = await fetchJson("/api/local/meetings/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    municipalityId: 1,
    meetingDate: "2026-06-01",
    submitterEmail: "test@test.com",
    agendaItems: [{ title: "<script>alert(1)</script>", description: "test" }],
  }),
});
log(localXss.status === 400 || localXss.status === 200 || localXss.status === 404 ? "PASS" : "WARN",
  "/api/local/meetings/submit (XSS)", `Status ${localXss.status}`);

// ─────────────────────────────────────────────
// PHASE 2g: Rate Limiting Behavior
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2g: Rate Limiting\n");

// Hit subscribe endpoint rapidly
const rateLimitResults = [];
for (let i = 0; i < 8; i++) {
  const r = await fetchJson("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `ratelimit${i}@test.com`, state: "VA" }),
  });
  rateLimitResults.push(r.status);
}
const has429 = rateLimitResults.includes(429);
const all400 = rateLimitResults.every(s => s === 400 || s === 422);
if (has429) {
  log("PASS", "/api/subscribe rate limit", `Rate limit triggered (429 seen after ${rateLimitResults.indexOf(429) + 1} reqs)`);
} else if (all400) {
  log("WARN", "/api/subscribe rate limit", "All requests returned 400 (validation before rate limit?)");
} else {
  log("FAIL", "/api/subscribe rate limit", `No rate limiting observed. Statuses: ${rateLimitResults.join(",")}`);
}

// ─────────────────────────────────────────────
// PHASE 2h: Sitemap Content Validation
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2h: Sitemap Validation\n");

const sitemap = await fetchHtml("/sitemap.xml");
if (sitemap.status === 200) {
  const urls = [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  log("PASS", "/sitemap.xml", `${urls.length} URLs found`);
  
  // Test a few URLs from sitemap
  const sampleUrls = urls.filter(u => u.includes("/state/")).slice(0, 3);
  for (const url of sampleUrls) {
    const path = new URL(url).pathname;
    const r = await fetchHtml(path);
    log(r.status === 200 ? "PASS" : "FAIL", path, `Sitemap URL status ${r.status}`);
  }
  
  // Check if state-legislature is in sitemap (shouldn't be if page doesn't exist)
  const hasLegislature = urls.some(u => u.includes("state-legislature"));
  if (hasLegislature) {
    log("FAIL", "/sitemap.xml", "Contains state-legislature URLs for non-existent pages");
  } else {
    log("PASS", "/sitemap.xml", "No state-legislature URLs (correct)");
  }
} else {
  log("FAIL", "/sitemap.xml", `Status ${sitemap.status}`);
}

// ─────────────────────────────────────────────
// PHASE 2i: Pagination & Query Parameter Edge Cases
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2i: Pagination & Query Edge Cases\n");

const pagTests = [
  { path: "/api/bills?limit=99999", desc: "excessive limit" },
  { path: "/api/bills?limit=-1", desc: "negative limit" },
  { path: "/api/bills?limit=abc", desc: "non-numeric limit" },
  { path: "/api/bills?page=99999", desc: "excessive page" },
  { path: "/api/candidates?party=INVALID_PARTY", desc: "invalid party filter" },
  { path: "/api/scotus/justices?limit=0", desc: "zero limit" },
  { path: "/api/search?q=<script>alert(1)</script>", desc: "XSS in search" },
];

for (const t of pagTests) {
  const r = await fetchJson(t.path);
  if (r.status === 200 || r.status === 400 || r.status === 422 || r.status === 429) {
    log("PASS", t.path, `Handled gracefully: ${r.status}`);
  } else {
    log("FAIL", t.path, `Unexpected status ${r.status}`, r.text.slice(0, 100));
  }
}

// ─────────────────────────────────────────────
// PHASE 2j: Compare Page
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2j: Compare Page\n");

const compare = await fetchHtml("/compare");
if (compare.status === 200) {
  log("PASS", "/compare", "Page loads");
} else {
  log("FAIL", "/compare", `Status ${compare.status}`);
}

// ─────────────────────────────────────────────
// PHASE 2k: Bill Detail Pages (multiple)
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2k: Bill Detail Pages\n");

const billsApi = await fetchJson("/api/bills?limit=5");
if (billsApi.json?.bills) {
  for (const bill of billsApi.json.bills.slice(0, 3)) {
    if (bill.externalId) {
      const r = await fetchHtml(`/state/VA/bills/${bill.externalId}`);
      log(r.status === 200 ? "PASS" : r.status === 404 ? "WARN" : "FAIL",
        `/state/VA/bills/${bill.externalId}`, `Status ${r.status}`);
    }
  }
}

// ─────────────────────────────────────────────
// PHASE 2l: Candidate Detail Pages
// ─────────────────────────────────────────────
console.log("\n📋 PHASE 2l: Candidate Detail Pages\n");

const candApi = await fetchJson("/api/candidates?limit=5");
if (candApi.json?.candidates) {
  for (const cand of candApi.json.candidates.slice(0, 3)) {
    const r = await fetchHtml(`/candidate/${cand.id}`);
    log(r.status === 200 ? "PASS" : "FAIL", `/candidate/${cand.id}`, `Status ${r.status}`);
  }
}

// ─────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log("📊 PHASE 2 SUMMARY");
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

import { writeFileSync } from "fs";
writeFileSync("uat-results-phase2.tsv", "Type\tRoute\tMessage\tDetail\n" + results.map(r => `${r.type}\t${r.route}\t${r.message}\t${r.detail}`).join("\n"));
console.log("\n📁 Full results written to uat-results-phase2.tsv");
