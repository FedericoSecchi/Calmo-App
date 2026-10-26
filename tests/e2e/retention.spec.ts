import { test, expect, type Page } from "@playwright/test";

async function openGuest(page: Page, path: string) {
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.setItem("calmo_lang", "en");
      localStorage.setItem("calmo_guest_mode", "1");
      localStorage.setItem("calmo_onboarding_complete", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto(path);
  await page.waitForSelector("main, h1", { timeout: 10_000 }).catch(() => {});
}

test.describe("Retention — logged-in navigation hints", () => {
  test("inside /app the logo navigates to /app", async ({ page }) => {
    await openGuest(page, "/app");
    // Topbar logo link should target /app, not the landing.
    const logoLink = page.locator('a[href="/app"]').first();
    await expect(logoLink).toBeVisible();
    await logoLink.click();
    await expect(page).toHaveURL(/\/app\/?$/);
  });

  test("public pages show 'Open app' instead of Sign in / Get started when a session is active", async ({ page }) => {
    await openGuest(page, "/");
    await expect(page.getByTestId("nav-open-app")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("link", { name: /^Sign in$/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Get started$/i })).toHaveCount(0);
  });

  test("/auth with an active session redirects straight to /app", async ({ page }) => {
    await openGuest(page, "/app");
    await page.goto("/auth");
    await expect(page).toHaveURL(/\/app\/?/, { timeout: 10_000 });
  });
});
