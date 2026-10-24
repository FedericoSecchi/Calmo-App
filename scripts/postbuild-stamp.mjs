#!/usr/bin/env node
// Replaces the "build-id" meta content in dist/index.html with the current
// commit sha (or a fallback). Keeps a single build identifier available to
// production checks.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
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
writeFileSync(index, html, "utf8");
console.log(`[stamp] build-id=${buildId}`);
