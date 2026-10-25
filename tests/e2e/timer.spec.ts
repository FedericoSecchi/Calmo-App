import { test, expect, type Page } from "@playwright/test";

// Boot a fresh guest session in English, bypassing landing and auth.
async function openGuestInEnglish(page: Page, path = "/app") {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.setItem("calmo_lang", "en");
      localStorage.setItem("calmo_guest_mode", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto(path);
  await page.waitForSelector("main, h1, h2", { timeout: 10_000 }).catch(() => {});
}

test.describe("Timer visibility", () => {
  test("tab title shows countdown while running and restores when stopped", async ({ page }) => {
    await openGuestInEnglish(page, "/app");
    // Hit the big Start button on the dashboard.
    await page.getByRole("button", { name: /^start$/i }).first().click();
    // Wait for the title to pick up the Focus phase countdown.
    await expect.poll(() => page.title(), { timeout: 10_000 }).toMatch(/· Focus — Calmo$/);
    // The title should contain a mm:ss (or h:mm:ss) prefix.
    expect(await page.title()).toMatch(/^\d{1,2}:\d{2}(:\d{2})? · Focus — Calmo$/);

    // Pause and expect the title to drop the countdown.
    await page.getByRole("button", { name: /^pause$/i }).first().click();
    await expect.poll(() => page.title(), { timeout: 10_000 }).not.toMatch(/· Focus — Calmo$/);
  });

  test("volume setting persists after reload", async ({ page }) => {
    await openGuestInEnglish(page, "/app");
    // Prime the preference and refresh — the hook reads from localStorage at
    // mount. This mirrors what we'd see after the user actually dragged the
    // slider, without poking Radix internals from the test.
    await page.evaluate(() => localStorage.setItem("calmo_timer_volume", "40"));
    await page.reload();
    await page.waitForSelector("h1", { timeout: 10_000 }).catch(() => {});
    const afterReload = await page.evaluate(() => localStorage.getItem("calmo_timer_volume"));
    expect(afterReload).toBe("40");
    // The slider lives inside the collapsible "Timer settings" panel on Home.
    await page.getByRole("button", { name: /Timer settings/i }).click();
    await expect(page.getByText(/^\s*40\s*$/).first()).toBeVisible({ timeout: 10_000 });
  });

  test("PiP button only appears if Document Picture-in-Picture exists", async ({ page }) => {
    await openGuestInEnglish(page, "/app");
    // Chromium exposes documentPictureInPicture — but Playwright headless does
    // too only on recent builds. Either way the button must match detection.
    const supported = await page.evaluate(() => "documentPictureInPicture" in window);
    const button = page.getByTestId("pip-toggle");
    if (supported) {
      await expect(button).toBeVisible();
    } else {
      await expect(button).toHaveCount(0);
    }
  });
});
