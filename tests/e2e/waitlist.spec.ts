import { test, expect } from "@playwright/test";

test("waitlist accepts a new email and a duplicate", async ({ page }) => {
  const email = `e2e+${Date.now()}@calmo.fit`;
  await page.goto("/");
  await page.locator("#pricing").scrollIntoViewIfNeeded();
  await page.locator('input[type="email"][aria-label*="waitlist" i], input[type="email"][aria-label*="espera" i]').fill(email);
  await page.getByRole("button", { name: /notify me|avisame/i }).click();
  await expect(page.getByText(/on the list|en la lista/i)).toBeVisible({ timeout: 15_000 });

  await page.reload();
  await page.locator("#pricing").scrollIntoViewIfNeeded();
  await page.locator('input[type="email"][aria-label*="waitlist" i], input[type="email"][aria-label*="espera" i]').fill(email);
  await page.getByRole("button", { name: /notify me|avisame/i }).click();
  await expect(page.getByText(/on the list|en la lista/i)).toBeVisible({ timeout: 15_000 });
});
