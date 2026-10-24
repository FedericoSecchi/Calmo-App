import { test, expect } from "@playwright/test";

test.describe("Public routes", () => {
  test("English home renders with correct SEO basics", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await expect(page).toHaveTitle(/Calmo.+Healthy habits/);
    await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", "https://calmo.fit/");
    await expect(page.locator("h1").first()).toContainText(/computer work/i);
    expect(errors).toEqual([]);
  });

  test("Spanish home renders at /es/", async ({ page }) => {
    await page.goto("/es/");
    await expect(page).toHaveTitle(/Calmo.+Hábitos saludables/);
    await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", "https://calmo.fit/es/");
    await expect(page.locator("h1").first()).toContainText(/computadora/i);
  });

  test("English SEO page about the 20-20-20 rule", async ({ page }) => {
    await page.goto("/20-20-20-rule/");
    await expect(page.locator("h1").first()).toContainText(/20-20-20/);
  });

  test("Spanish SEO page about regla 20-20-20", async ({ page }) => {
    await page.goto("/es/regla-20-20-20/");
    await expect(page.locator("h1").first()).toContainText(/20-20-20/);
  });

  test("Privacy page in English and Spanish", async ({ page }) => {
    await page.goto("/privacy/");
    await expect(page.locator("h1").first()).toContainText(/Privacy/i);
    await page.goto("/es/privacidad/");
    await expect(page.locator("h1").first()).toContainText(/Privacidad/i);
  });
});
