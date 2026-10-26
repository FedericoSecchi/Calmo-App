import { test, expect, type Page } from "@playwright/test";

async function freshGuest(page: Page) {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.clear();
      localStorage.setItem("calmo_lang", "en");
      localStorage.setItem("calmo_guest_mode", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto("/app");
}

test.describe("Welcome tour", () => {
  test("first visit shows the tour; dismissing it keeps it dismissed", async ({ page }) => {
    await freshGuest(page);
    await expect(page.getByTestId("welcome-tour")).toBeVisible({ timeout: 10_000 });

    // Dismiss via the explicit "Skip" button at the bottom.
    await page.getByTestId("welcome-tour-skip-text").click();
    await expect(page.getByTestId("welcome-tour")).toHaveCount(0);

    await page.reload();
    await page.waitForSelector("main, h1", { timeout: 10_000 }).catch(() => {});
    await expect(page.getByTestId("welcome-tour")).toHaveCount(0);

    // The persisted flag is what gatekeeps the tour.
    const flag = await page.evaluate(() => localStorage.getItem("calmo_onboarding_complete"));
    expect(flag).toBe("1");
  });

  test("the help '?' button reopens the tour", async ({ page }) => {
    await freshGuest(page);
    await page.getByTestId("welcome-tour-skip-text").click();
    await expect(page.getByTestId("welcome-tour")).toHaveCount(0);

    await page.getByTestId("help-open").click();
    await expect(page.getByTestId("help-sheet")).toBeVisible();
    await page.getByTestId("help-show-tour").click();
    await expect(page.getByTestId("welcome-tour")).toBeVisible({ timeout: 5_000 });
  });
});
