#!/usr/bin/env node
// Prerenders every public route into dist/<path>/index.html.
// Serves dist/ with a tiny node:http server (SPA fallback), drives Playwright,
// writes HTML. Avoids `vite preview` which hangs in CI.

import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync, createReadStream } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import net from "node:net";
import { chromium } from "@playwright/test";
import { allPublicRoutes, allNoindexRoutes } from "./routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");

if (!existsSync(join(DIST, "index.html"))) {
  console.error("[prerender] dist/index.html missing — run `npm run build` first.");
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

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

const port = await findFreePort();
const serverUrl = `http://127.0.0.1:${port}`;
const indexHtml = readFileSync(join(DIST, "index.html"));

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url, serverUrl);
    const safe = url.pathname.replace(/\.\./g, "");
    const direct = join(DIST, safe);
    if (safe !== "/" && existsSync(direct) && statSync(direct).isFile()) {
      const ext = direct.slice(direct.lastIndexOf("."));
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      createReadStream(direct).pipe(res);
      return;
    }
    // SPA fallback
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexHtml);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
console.log(`[prerender] http server listening on ${serverUrl}`);

try {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__CALMO_PRERENDER__ = true;
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);

  const routes = [...allPublicRoutes(), ...allNoindexRoutes()];
  let success = 0;
  const failures = [];

  for (const route of routes) {
    const url = `${serverUrl}${route.path}`;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1");
      await page.waitForTimeout(400);
      const html = await page.content();
      const outPath = route.path === "/" ? "/index.html" : `${route.path}index.html`;
      const absolutePath = join(DIST, outPath.startsWith("/") ? outPath.slice(1) : outPath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, html, "utf8");
      success += 1;
      console.log(`[prerender] ✓ ${route.path}`);
    } catch (error) {
      failures.push({ path: route.path, error: String(error && error.message ? error.message : error) });
      console.error(`[prerender] ✗ ${route.path}:`, error && error.message ? error.message : error);
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error(`[prerender] ${failures.length} failure(s)`);
    process.exitCode = 1;
  } else {
    console.log(`[prerender] all ${success} routes rendered`);
  }
} finally {
  server.close();
}
