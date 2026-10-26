import { test, expect, type Page } from "@playwright/test";

async function openGuestInEnglish(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.setItem("calmo_lang", "en");
      localStorage.setItem("calmo_guest_mode", "1");
      localStorage.setItem("calmo_onboarding_complete", "1");
      localStorage.removeItem("calmo_garden_theme");
      localStorage.removeItem("calmo_break_logs");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/app");
  await page.waitForSelector("h1", { timeout: 10_000 });
}

async function openTimerSettings(page: Page) {
  await page.getByRole("button", { name: /Timer settings/ }).click();
}

test.describe("Garden", () => {
  test("changing the garden style persists after reload", async ({ page }) => {
    await openGuestInEnglish(page);
    await openTimerSettings(page);
    await page.getByRole("button", { name: /Night sky/ }).click();
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("calmo_garden_theme")))
      .toBe("sky");
    await page.reload();
    await page.waitForSelector("h1", { timeout: 10_000 });
    const stored = await page.evaluate(() => localStorage.getItem("calmo_garden_theme"));
    expect(stored).toBe("sky");
  });

  test("logging a break changes the zen garden scene", async ({ page }) => {
    await openGuestInEnglish(page);
    // Ensure zen is active with no pre-logged activity
    await page.evaluate(() => {
      localStorage.setItem("calmo_garden_theme", "zen");
      localStorage.removeItem("calmo_break_logs");
      localStorage.removeItem("calmo_manual_break_adjustments");
    });
    await page.reload();
    await page.waitForSelector("h1", { timeout: 10_000 });

    const todayCard = page.locator('section:has-text("Your garden")').first();
    const before = await todayCard.locator("svg path").count();

    // Inject one manual +1 adjustment for today directly in guest storage —
    // this is exactly what the "+" button writes.
    await page.evaluate(() => {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem(
        "calmo_manual_break_adjustments",
        JSON.stringify({ [today]: 1 }),
      );
    });
    await page.reload();
    await page.waitForSelector("h1", { timeout: 10_000 });

    const after = await todayCard.locator("svg path").count();
    expect(after).toBeGreaterThan(before);
  });

  test("the download button triggers a PNG blob", async ({ page }) => {
    await openGuestInEnglish(page);
    const todayCard = page.locator('section:has-text("Your garden")').first();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      todayCard.getByRole("button", { name: /^Download$/ }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/);
  });
});
