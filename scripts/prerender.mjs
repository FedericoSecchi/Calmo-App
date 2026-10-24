#!/usr/bin/env node
// Prerenders every public route into dist/<path>/index.html.
// Starts `vite preview` on a random free port, drives Playwright, writes HTML.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { allPublicRoutes } from "./routes.mjs";
import net from "node:net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");

if (!existsSync(join(DIST, "index.html"))) {
  console.error("[prerender] dist/index.html missing — run `npm run build` first.");
  process.exit(1);
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`timeout waiting for ${url}`);
}

const port = await findFreePort();
const serverUrl = `http://localhost:${port}`;

console.log(`[prerender] starting vite preview on ${serverUrl}`);
const previewProcess = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], {
  cwd: join(__dirname, ".."),
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, FORCE_COLOR: "0" },
});
let previewClosed = false;
previewProcess.on("exit", () => (previewClosed = true));

try {
  await waitForServer(`${serverUrl}/`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__CALMO_PRERENDER__ = true;
  });
  const page = await context.newPage();

  const routes = allPublicRoutes();
  let success = 0;
  const failures = [];

  for (const route of routes) {
    const url = `${serverUrl}${route.path}`;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForSelector("h1", { timeout: 15000 });
      // Give React one more tick so usePageSEO can set canonical/hreflang.
      await page.waitForTimeout(400);
      const html = await page.content();
      const outPath = route.path === "/" ? "/index.html" : `${route.path}index.html`;
      const absolutePath = join(DIST, outPath.startsWith("/") ? outPath.slice(1) : outPath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, html, "utf8");
      success += 1;
      console.log(`[prerender] ✓ ${route.path} → ${outPath}`);
    } catch (error) {
      failures.push({ path: route.path, error: String(error) });
      console.error(`[prerender] ✗ ${route.path}:`, error.message);
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error(`[prerender] ${failures.length} failure(s)`);
    process.exitCode = 1;
  } else {
    console.log(`[prerender] all ${success} routes rendered`);
  }

  // Replace build-id token in every prerendered HTML.
  const buildId = process.env.BUILD_ID || process.env.GITHUB_SHA || "dev";
  const indexHtml = readFileSync(join(DIST, "index.html"), "utf8");
  // find current build-id in the dist/index.html (set by postbuild-stamp)
  const match = indexHtml.match(/<meta name="build-id" content="([^"]*)"/);
  if (match && match[1]) {
    console.log(`[prerender] build-id (from index.html): ${match[1]}`);
  }
  void buildId;
} finally {
  if (!previewClosed) previewProcess.kill("SIGTERM");
}
