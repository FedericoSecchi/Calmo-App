#!/usr/bin/env node
// Renders each garden style × (empty, with activity) into docs/screenshots/.
// Runs the built SPA in guest mode and prefills localStorage so Dashboard
// draws the right counts, then screenshots the "Today" garden card.

import { mkdirSync, existsSync, readFileSync, statSync, createReadStream } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import net from "node:net";
import { chromium } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const OUT_DIR = join(ROOT, "docs", "screenshots");
mkdirSync(OUT_DIR, { recursive: true });

if (!existsSync(join(DIST, "index.html"))) {
  console.error("[gshots] dist/ missing — run `npm run build` first.");
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
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
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexHtml);
  } catch (error) {
    res.writeHead(500);
    res.end(String(error));
  }
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
console.log(`[gshots] http server on ${serverUrl}`);

const today = new Date().toISOString().slice(0, 10);
function datesArray(n) {
  return Array.from({ length: n }, () => today);
}

const SCENARIOS = [
  { name: "zen-empty", theme: "zen", counts: { break: 0, exercise: 0, water: 0 } },
  { name: "zen-active", theme: "zen", counts: { break: 4, exercise: 3, water: 5 } },
  { name: "sky-empty", theme: "sky", counts: { break: 0, exercise: 0, water: 0 } },
  { name: "sky-active", theme: "sky", counts: { break: 4, exercise: 3, water: 5 } },
  { name: "companion-empty", theme: "companion", counts: { break: 0, exercise: 0, water: 0 } },
  { name: "companion-active", theme: "companion", counts: { break: 4, exercise: 3, water: 5 } },
];

try {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();

  for (const sc of SCENARIOS) {
    // Reset storage, then seed with the counts and the chosen theme.
    await page.goto(serverUrl);
    await page.evaluate(({ theme, counts, today }) => {
      try {
        localStorage.clear();
        localStorage.setItem("calmo_lang", "es");
        localStorage.setItem("calmo_guest_mode", "1");
        localStorage.setItem("calmo_garden_theme", theme);
        const breakDates = Array.from({ length: counts.break }, () => today);
        const waterDates = Array.from({ length: counts.water }, () => today);
        const exerciseLogs = Array.from({ length: counts.exercise }, (_, i) => ({
          exercise_id: `screenshot-${i}`,
          completed_at: new Date().toISOString(),
        }));
        localStorage.setItem("calmo_break_logs", JSON.stringify(breakDates));
        localStorage.setItem("calmo_water_logs", JSON.stringify(waterDates));
        localStorage.setItem("calmo_exercise_completions", JSON.stringify(exerciseLogs));
      } catch (e) {
        /* ignore */
      }
    }, { ...sc, today });

    await page.goto(`${serverUrl}/app`, { waitUntil: "domcontentloaded" });
    // Wait for the "Tu jardín" section + today card to render.
    const todayCard = page.locator('h2:has-text("Tu jardín")').locator('xpath=following::div[contains(@class,"rounded-2xl")][1]').first();
    await todayCard.waitFor({ state: "visible", timeout: 15_000 });
    // Give animations a beat.
    await page.waitForTimeout(400);
    const outPath = join(OUT_DIR, `garden-${sc.name}.png`);
    await todayCard.screenshot({ path: outPath });
    console.log(`[gshots] ✓ ${sc.name} → ${outPath}`);
  }

  await browser.close();
} finally {
  server.close();
}
