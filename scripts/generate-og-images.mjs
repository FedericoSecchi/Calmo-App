#!/usr/bin/env node
// Generates og-image-en.png and og-image-es.png in dist/ using Playwright + an inline HTML template.

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");
mkdirSync(DIST, { recursive: true });

const COPY = {
  en: {
    kicker: "Calmo",
    title: "Healthy habits for computer work, without the pain.",
    tag: "Focus timer · screen breaks · mobility · breathing",
  },
  es: {
    kicker: "Calmo",
    title: "Hábitos saludables para trabajar con la computadora, sin dolor.",
    tag: "Foco · pausas de pantalla · movilidad · respiración",
  },
};

const JOIN_COPY = {
  en: {
    kicker: "Calmo · Focus room",
    title: "You've been invited to focus together.",
    tag: "A shared focus timer that stays in sync.",
  },
  es: {
    kicker: "Calmo · Sala de foco",
    title: "Te invitaron a enfocarte en equipo.",
    tag: "Un temporizador compartido que queda en sincronía.",
  },
};

// Load Hammersmith One + Montserrat via @fontsource woff2 as base64 data URLs
// so the OG image generation does not hit any external network.
function fontData(relative) {
  const abs = join(__dirname, "..", "node_modules", relative);
  const buf = readFileSync(abs);
  return `data:font/woff2;base64,${buf.toString("base64")}`;
}

const hammersmith = fontData("@fontsource/hammersmith-one/files/hammersmith-one-latin-400-normal.woff2");
const montserrat500 = fontData("@fontsource/montserrat/files/montserrat-latin-500-normal.woff2");
const montserrat700 = fontData("@fontsource/montserrat/files/montserrat-latin-700-normal.woff2");

const html = (copy) => `<!doctype html><html><head><meta charset="utf-8"/><style>
@font-face{font-family:'HammersmithOne';src:url(${hammersmith}) format('woff2');font-weight:400;font-style:normal;font-display:block;}
@font-face{font-family:'MontserratLocal';src:url(${montserrat500}) format('woff2');font-weight:500;font-style:normal;font-display:block;}
@font-face{font-family:'MontserratLocal';src:url(${montserrat700}) format('woff2');font-weight:700;font-style:normal;font-display:block;}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{width:1200px;height:630px;font-family:'HammersmithOne','MontserratLocal',sans-serif;}
body{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#F3EBDD 0%,#E8D9BC 100%);color:#1F1A14;padding:72px;}
.card{position:relative;width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;border-radius:40px;background:#FBF5EA;padding:72px;box-shadow:0 32px 80px rgba(0,0,0,0.08);border:2px solid rgba(0,0,0,0.06);overflow:hidden;}
.dot{position:absolute;right:-200px;top:-200px;width:600px;height:600px;border-radius:50%;background:rgba(132,129,86,0.22);}
.kicker{font-family:'HammersmithOne',sans-serif;font-size:48px;color:#71684F;letter-spacing:-0.5px;position:relative;z-index:1;}
h1{font-family:'HammersmithOne',sans-serif;font-size:88px;line-height:1.05;color:#1F1A14;max-width:900px;position:relative;z-index:1;}
.tag{font-family:'MontserratLocal',sans-serif;font-size:30px;color:#5A5346;font-weight:500;position:relative;z-index:1;}
</style>
</head><body>
<div class="card">
  <div class="dot"></div>
  <div class="kicker">${copy.kicker}</div>
  <h1>${copy.title}</h1>
  <div class="tag">${copy.tag}</div>
</div>
</body></html>`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await context.newPage();

for (const lang of ["en", "es"]) {
  await page.setContent(html(COPY[lang]), { waitUntil: "networkidle" });
  const outPath = join(DIST, `og-image-${lang}.png`);
  await page.screenshot({ path: outPath, type: "png", omitBackground: false, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  const ok = existsSync(outPath);
  console.log(`[og] ${ok ? "✓" : "✗"} ${outPath}`);
}

for (const lang of ["en", "es"]) {
  await page.setContent(html(JOIN_COPY[lang]), { waitUntil: "networkidle" });
  const outPath = join(DIST, `og-image-join-${lang}.png`);
  await page.screenshot({ path: outPath, type: "png", omitBackground: false, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  const ok = existsSync(outPath);
  console.log(`[og] ${ok ? "✓" : "✗"} ${outPath}`);
}

await browser.close();
