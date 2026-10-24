#!/usr/bin/env node
// Replaces the "build-id" meta content in dist/index.html with the current
// commit sha (or a fallback). Also injects a <link rel="preload"> for the
// hero's Hammersmith One woff2 so the H1 renders without the layout shift
// that we otherwise see when the fallback font swaps.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "..", "dist");

function resolveBuildId() {
  if (process.env.BUILD_ID) return process.env.BUILD_ID;
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "dev-" + Date.now();
  }
}

function findHeroFont() {
  const assets = join(dist, "assets");
  if (!existsSync(assets)) return null;
  const files = readdirSync(assets);
  // Prefer the plain latin subset so the preload actually matches what the
  // CSS font-face resolves to for the H1.
  return (
    files.find((f) => /^hammersmith-one-latin-400-normal-.*\.woff2$/.test(f)) ??
    files.find((f) => /^hammersmith-one-.*latin-400-normal.*\.woff2$/.test(f)) ??
    null
  );
}

const buildId = resolveBuildId();
const index = join(dist, "index.html");
if (!existsSync(index)) {
  console.warn("[stamp] dist/index.html missing — did build run?");
  process.exit(0);
}
let html = readFileSync(index, "utf8");
html = html.replace(/<meta name="build-id" content="[^"]*"\s*\/?>/, `<meta name="build-id" content="${buildId}" />`);
if (!html.includes('name="build-id"')) {
  html = html.replace("</head>", `  <meta name="build-id" content="${buildId}" />\n  </head>`);
}

const heroFont = findHeroFont();
if (heroFont && !html.includes(heroFont)) {
  const preload = `  <link rel="preload" href="/assets/${heroFont}" as="font" type="font/woff2" crossorigin />\n  `;
  html = html.replace("</head>", `${preload}</head>`);
}

writeFileSync(index, html, "utf8");
console.log(`[stamp] build-id=${buildId}${heroFont ? ` font=${heroFont}` : ""}`);
