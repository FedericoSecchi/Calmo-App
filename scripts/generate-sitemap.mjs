#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { allPublicRoutes, SITE_URL } from "./routes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv.includes("--dist")
  ? join(__dirname, "..", "dist")
  : join(__dirname, "..", "public");

mkdirSync(outDir, { recursive: true });

const lastmod = new Date().toISOString().split("T")[0];

const routes = allPublicRoutes();

const urls = routes
  .map((r) => {
    const alternates = (["en", "es"])
      .map((lang) => {
        const path = lang === r.lang ? r.path : r.alt;
        return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${path}" />`;
      })
      .join("\n");
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${r.lang === "en" ? r.path : r.alt}" />`;
    return `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
${alternates}
${xDefault}
  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

writeFileSync(join(outDir, "sitemap.xml"), sitemap, "utf8");

const robots = `User-agent: *
Allow: /
Disallow: /app
Disallow: /app/
Disallow: /auth
Disallow: /onboarding

Sitemap: ${SITE_URL}/sitemap.xml
`;
writeFileSync(join(outDir, "robots.txt"), robots, "utf8");

console.log("sitemap.xml and robots.txt written to", outDir);
