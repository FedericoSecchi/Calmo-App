#!/usr/bin/env node
// Verifies that `dist/` has the expected shape after build + prerender.
// Exits non-zero on failure so CI can gate on it.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { allPublicRoutes, allNoindexRoutes, SITE_URL } from "./routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");

const failures = [];

function fail(msg) {
  failures.push(msg);
  console.error(`[verify] ✗ ${msg}`);
}

function pass(msg) {
  console.log(`[verify] ✓ ${msg}`);
}

if (!existsSync(join(DIST, "index.html"))) fail("missing dist/index.html");
if (!existsSync(join(DIST, "sitemap.xml"))) fail("missing dist/sitemap.xml");
if (!existsSync(join(DIST, "robots.txt"))) fail("missing dist/robots.txt");
if (!existsSync(join(DIST, "og-image-en.png"))) fail("missing og-image-en.png");
if (!existsSync(join(DIST, "og-image-es.png"))) fail("missing og-image-es.png");
if (!existsSync(join(DIST, "og-image-join-en.png"))) fail("missing og-image-join-en.png");
if (!existsSync(join(DIST, "og-image-join-es.png"))) fail("missing og-image-join-es.png");

for (const route of allPublicRoutes()) {
  const htmlPath = route.path === "/" ? "index.html" : join(route.path.slice(1), "index.html");
  const abs = join(DIST, htmlPath);
  if (!existsSync(abs)) {
    fail(`missing prerendered ${htmlPath}`);
    continue;
  }
  const html = readFileSync(abs, "utf8");
  const expectedCanonical = `${SITE_URL}${route.path}`;
  if (!html.includes(`<title>`)) fail(`${htmlPath}: no <title>`);
  if (!html.includes(`name="description"`)) fail(`${htmlPath}: no description meta`);
  if (!html.includes(expectedCanonical)) fail(`${htmlPath}: canonical not pointing to ${expectedCanonical}`);
  if (!html.includes('rel="alternate"')) fail(`${htmlPath}: no hreflang alternates`);
  if (!html.includes("<h1")) fail(`${htmlPath}: no <h1>`);
  if (!html.match(/<meta name="build-id"/)) fail(`${htmlPath}: no build-id meta`);
}

const sitemap = readFileSync(join(DIST, "sitemap.xml"), "utf8");
for (const route of allPublicRoutes()) {
  if (!sitemap.includes(`${SITE_URL}${route.path}`)) {
    fail(`sitemap missing ${route.path}`);
  }
}
if (sitemap.includes("/app") || sitemap.includes("/auth") || sitemap.includes("/onboarding")) {
  fail("sitemap must not include /app /auth or /onboarding");
}

const robots = readFileSync(join(DIST, "robots.txt"), "utf8");
if (!robots.includes("Sitemap: https://calmo.fit/sitemap.xml")) fail("robots.txt must reference sitemap");
if (!robots.includes("Disallow: /app")) fail("robots.txt must disallow /app");

// /join/ and /es/unirse/ must prerender with og:title and noindex. They are
// not in the sitemap (noindex) but must respond 200 with the right metadata
// so WhatsApp/Slack/iMessage can produce a preview.
for (const route of allNoindexRoutes()) {
  const htmlPath = route.path === "/" ? "index.html" : join(route.path.slice(1), "index.html");
  const abs = join(DIST, htmlPath);
  if (!existsSync(abs)) {
    fail(`missing noindex prerendered ${htmlPath}`);
    continue;
  }
  const html = readFileSync(abs, "utf8");
  if (!/property="og:title"/.test(html)) fail(`${htmlPath}: no og:title meta`);
  if (!/property="og:description"/.test(html)) fail(`${htmlPath}: no og:description meta`);
  if (!/property="og:image"/.test(html)) fail(`${htmlPath}: no og:image meta`);
  if (!/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) fail(`${htmlPath}: missing noindex`);
  if (sitemap.includes(`${SITE_URL}${route.path}`)) fail(`sitemap must not list noindex ${route.path}`);
}

if (failures.length > 0) {
  console.error(`[verify] FAILED (${failures.length})`);
  process.exit(1);
}
pass(`all ${allPublicRoutes().length} public routes verified`);
