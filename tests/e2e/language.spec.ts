import { test, expect } from "@playwright/test";

test("language switcher between / and /es/", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: /español/i }).first().click();
  await expect(page).toHaveURL(/\/es\//);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.getByRole("link", { name: /english/i }).first().click();
  await expect(page).toHaveURL(/\/$/);
});
