#!/usr/bin/env node
// Runs Lighthouse mobile against a list of URLs and prints a score summary.
// Uses the Chromium bundled with Playwright so we don't need a system Chrome.
//
// Usage:
//   node scripts/lighthouse-mobile.mjs <url> [<url>...]
//
// Env:
//   LH_MIN_PERF    minimum performance score (0-100) that gates exit code; 0 disables (default: 0)
//   LH_MIN_A11Y    minimum accessibility score; default 100
//   LH_MIN_SEO     minimum SEO score; default 95
//   LH_MIN_BP      minimum best-practices score; default 95
//   LH_URL_TIMEOUT_MS  hard limit per URL before failing (default: 240000)

import { createServer } from "node:net";
import { chromium } from "playwright";
import lighthouse from "lighthouse";

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error("usage: lighthouse-mobile.mjs <url> [<url>...]");
  process.exit(2);
}

const MIN_PERF = Number(process.env.LH_MIN_PERF ?? 0);
const MIN_A11Y = Number(process.env.LH_MIN_A11Y ?? 100);
const MIN_SEO = Number(process.env.LH_MIN_SEO ?? 95);
const MIN_BP = Number(process.env.LH_MIN_BP ?? 95);
const URL_TIMEOUT_MS = Number(process.env.LH_URL_TIMEOUT_MS ?? 240_000);

// A free port for the DevTools protocol: a fixed 9222 can be held by a stale
// browser, and Lighthouse then waits on it forever.
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// Lighthouse has no overall deadline; without this a stuck protocol
// connection hangs verify.sh indefinitely.
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function run() {
  const port = await freePort();
  const browser = await chromium.launch({
    args: [`--remote-debugging-port=${port}`],
    timeout: 60_000,
  });
  const summaries = [];
  let failed = false;
  try {
    for (const url of urls) {
      const result = await withTimeout(lighthouse(url, {
        port,
        maxWaitForLoad: 60_000,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        throttlingMethod: "simulate",
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 562.5,
          downloadThroughputKbps: 1474.56,
          uploadThroughputKbps: 675,
        },
      }), URL_TIMEOUT_MS, `lighthouse ${url}`);
      if (!result) throw new Error(`lighthouse returned no result for ${url}`);
      const categories = result.lhr.categories;
      const audits = result.lhr.audits;
      const perf = Math.round(categories.performance.score * 100);
      const a11y = Math.round(categories.accessibility.score * 100);
      const seo = Math.round(categories.seo.score * 100);
      const bp = Math.round(categories["best-practices"].score * 100);
      const fcp = Math.round(audits["first-contentful-paint"].numericValue);
      const lcp = Math.round(audits["largest-contentful-paint"].numericValue);
      const si = Math.round(audits["speed-index"].numericValue);
      const tbt = Math.round(audits["total-blocking-time"].numericValue);
      const cls = audits["cumulative-layout-shift"].numericValue.toFixed(3);
      // Count transferred JS from the network records audit.
      const network = audits["network-requests"]?.details?.items ?? [];
      const jsBytes = network
        .filter((r) => r.resourceType === "Script")
        .reduce((sum, r) => sum + (r.transferSize ?? 0), 0);
      summaries.push({ url, perf, a11y, seo, bp, fcp, lcp, si, tbt, cls, jsBytes });
      if (perf < MIN_PERF) failed = true;
      if (a11y < MIN_A11Y) failed = true;
      if (seo < MIN_SEO) failed = true;
      if (bp < MIN_BP) failed = true;
    }
  } finally {
    await withTimeout(browser.close(), 15_000, "browser.close").catch(() => {});
  }

  console.log("");
  console.log("┌─ Lighthouse (mobile) ────────────────────────────────────┐");
  for (const s of summaries) {
    console.log(` ${s.url}`);
    console.log(
      `   perf=${s.perf}  a11y=${s.a11y}  seo=${s.seo}  bp=${s.bp}`,
    );
    console.log(
      `   FCP=${s.fcp}ms  LCP=${s.lcp}ms  SI=${s.si}ms  TBT=${s.tbt}ms  CLS=${s.cls}  JS=${(s.jsBytes / 1024).toFixed(1)}KiB`,
    );
  }
  console.log("└──────────────────────────────────────────────────────────┘");

  if (failed) {
    console.error(
      `\n[lighthouse] gate failed (perf≥${MIN_PERF} a11y≥${MIN_A11Y} seo≥${MIN_SEO} bp≥${MIN_BP})`,
    );
    process.exit(1);
  }
}

run().then(
  // Exit explicitly: a lingering Lighthouse/CDP handle must not keep node alive.
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
