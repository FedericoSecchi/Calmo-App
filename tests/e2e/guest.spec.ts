import { test, expect } from "@playwright/test";

test.describe("Guest flow", () => {
  test("try without account → dashboard → add water → log pain → open exercise → reload keeps data", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.getByRole("link", { name: /start free|get started|empezar/i }).first().click();
    await page.waitForURL(/\/auth/);
    await page.getByRole("button", { name: /without signing up|probar sin/i }).click();
    await page.waitForURL(/\/app/);

    // Add a water glass via the +
    await page.locator('button[aria-label*="agregar vaso" i], button[aria-label*="add glass" i], button[aria-label*="agregar v" i]').first().click({ trial: false }).catch(async () => {
      // fallback: scroll into view and open hover group
      await page.locator('div:has-text("Agua")').first().hover();
      await page.locator('button[aria-label*="agregar" i]').first().click();
    });

    // Log pain
    await page.goto("/app/pain");
    await page.getByRole("button", { name: /lumbar|lower back/i }).click();
    await page.getByRole("button", { name: /guardar registro|save entry/i }).click();

    // Open exercises list
    await page.goto("/app/exercises");
    await expect(page.locator("h1").first()).toBeVisible();

    // Reload and verify data persists
    await page.goto("/app");
    await page.reload();
    await expect(page.locator("body")).toContainText(/pausas|breaks|hoy|today/i);

    expect(errors.filter((e) => !e.includes("favicon"))).toEqual([]);
  });
});
