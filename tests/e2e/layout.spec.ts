import { test, expect, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
];

async function openGuestSpanish(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.setItem("calmo_lang", "es");
      localStorage.setItem("calmo_guest_mode", "1");
    } catch {
      /* ignore */
    }
  });
}

async function assertNoCardOverflow(page: Page, label: string) {
  const widths = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("main button, main [class*='rounded-2xl']"));
    return nodes
      .filter((n) => n.offsetWidth > 0)
      .map((n) => {
        const inner = n.scrollWidth;
        const outer = n.clientWidth;
        const text = (n.textContent || "").slice(0, 60).replace(/\s+/g, " ").trim();
        return { inner, outer, text };
      });
  });
  const bad = widths.filter((w) => w.inner > w.outer + 1);
  expect
    .soft(
      bad,
      `[${label}] cards overflow horizontally: ${bad.map((b) => `(${b.inner}>${b.outer}) "${b.text}"`).join(" | ")}`,
    )
    .toEqual([]);
}

test.describe("Dashboard cards never overflow horizontally", () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name} ${vp.width}×${vp.height} /app`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openGuestSpanish(page);
      await page.goto("/app");
      await page.waitForSelector("main", { timeout: 10_000 });
      await assertNoCardOverflow(page, `/app ${vp.name}`);
    });
  }
});
