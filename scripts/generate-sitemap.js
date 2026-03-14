#!/usr/bin/env node
/**
 * Generates sitemap.xml for calmo.fit.
 * Run before build: node scripts/generate-sitemap.js
 * Output: public/sitemap.xml
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseUrl = "https://calmo.fit";

const routes = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/auth", changefreq: "monthly", priority: "0.6" },
  { path: "/onboarding", changefreq: "monthly", priority: "0.5" },
  { path: "/portfolio", changefreq: "weekly", priority: "0.8" },
  { path: "/case-studies", changefreq: "weekly", priority: "0.8" },
  { path: "/programmatic-seo", changefreq: "monthly", priority: "0.7" },
  { path: "/image-seo", changefreq: "monthly", priority: "0.7" },
  { path: "/20-20-20-rule", changefreq: "monthly", priority: "0.8" },
  { path: "/desk-stretch", changefreq: "monthly", priority: "0.8" },
  { path: "/eye-strain", changefreq: "monthly", priority: "0.8" },
  { path: "/computer-breaks", changefreq: "monthly", priority: "0.8" },
];

const lastmod = new Date().toISOString().split("T")[0];

const urls = routes
  .map(
    (r) => `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const outPath = join(__dirname, "..", "public", "sitemap.xml");
writeFileSync(outPath, sitemap, "utf8");
console.log("Generated:", outPath);
