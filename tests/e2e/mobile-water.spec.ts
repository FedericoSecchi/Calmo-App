import { test, expect, type Page } from "@playwright/test";

// Phone-sized touch device: the dashboard +/- controls must be visible and
// tappable without hover (they used to be opacity-0 until mouse hover).
test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

async function enterAsGuest(page: Page, waterLogs: string[] = []) {
  await page.goto("/auth");
  await page.getByRole("button", { name: /without signing up|probar sin/i }).click();
  await page.waitForURL(/\/app/);
  await page.evaluate((logs) => {
    localStorage.setItem("calmo_onboarding_complete", "1");
    localStorage.setItem("calmo_water_logs", JSON.stringify(logs));
  }, waterLogs);
  await page.reload();
}

test("water + is visible, at least 44×44 and tappable at 375 px; counter goes 0 → 1", async ({ page }) => {
  await enterAsGuest(page);

  const add = page.getByRole("button", { name: /^(add glass|agregar vaso)$/i });
  await expect(add).toBeVisible();
  // Not hidden behind a hover-only opacity.
  await expect(add.locator("xpath=..")).toHaveCSS("opacity", "1");
  const box = await add.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  // Fully inside the viewport (no overflow of the card at 375 px).
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);

  const remove = page.getByRole("button", { name: /^(remove glass|quitar vaso)$/i });
  await expect(remove).toBeVisible();

  const counter = page.getByText(/^(glasses of water|vasos de agua)$/i).first().locator("xpath=preceding-sibling::div[1]/p[1]");
  await expect(counter).toHaveText("0");
  await add.tap();
  await expect(counter).toHaveText("1");

  // No horizontal scroll on the dashboard at phone width.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("streak alive from yesterday shows the keep-it line; logging today hides it", async ({ page }) => {
  const day = 24 * 60 * 60 * 1000;
  const noonToday = new Date();
  noonToday.setHours(12, 0, 0, 0);
  const yesterday = [1, 2, 3].map((n) => new Date(noonToday.getTime() - n * day).toISOString());
  await enterAsGuest(page, yesterday);

  await expect(page.getByTestId("streak-days")).toHaveText("3");
  await expect(page.getByTestId("streak-keep")).toHaveText(/take a break today to keep it|haz una pausa hoy para mantenerla/i);

  await page.getByRole("button", { name: /^(add glass|agregar vaso)$/i }).tap();
  await expect(page.getByTestId("streak-days")).toHaveText("4");
  await expect(page.getByTestId("streak-keep")).toHaveCount(0);
});
