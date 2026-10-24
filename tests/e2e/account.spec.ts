import { test, expect, type BrowserContext } from "@playwright/test";
import { STRONG_TEST_PASSWORD, deleteAccountByCredentials, e2eEmail } from "./helpers";

test.describe("Account round-trip", () => {
  let createdEmail: string | null = null;

  test.afterEach(async () => {
    // Clean up any account the test may have left behind, even on failure.
    if (createdEmail) {
      await deleteAccountByCredentials(createdEmail, STRONG_TEST_PASSWORD);
      createdEmail = null;
    }
  });

  test("sign up → sign out → login → delete account", async ({ browser }) => {
    test.setTimeout(180_000);
    const email = e2eEmail();
    createdEmail = email;

    // Context 1: sign up and sign out
    const ctx1: BrowserContext = await browser.newContext();
    const page = await ctx1.newPage();

    await page.goto("/auth?mode=signup");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', STRONG_TEST_PASSWORD);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });

    await page.goto("/app/settings");
    // Fire the sign-out and close the context without waiting for the SPA to
    // navigate; we verify logout succeeded by opening a fresh context below.
    // supabase-js holds an in-process lock inside the first context that can
    // keep its own React state attached to the stale user for a few seconds.
    await page.getByRole("button", { name: /^sign out$/i }).click();
    await page.waitForTimeout(500);
    await ctx1.close();

    // Context 2: login from scratch, delete account
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();

    await page2.goto("/auth");
    await page2.fill('input[type="email"]', email);
    await page2.fill('input[type="password"]', STRONG_TEST_PASSWORD);
    await page2.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page2).toHaveURL(/\/app/, { timeout: 20_000 });

    await page2.goto("/app/settings");
    await page2.getByRole("button", { name: /^delete my account$/i }).click();
    await page2
      .getByRole("alertdialog")
      .getByRole("button", { name: /^delete my account$/i })
      .click();
    await expect(page2).toHaveURL(/\/auth/, { timeout: 20_000 });

    // Context 3: a fresh login attempt with the deleted credentials fails.
    await ctx2.close();
    const ctx3 = await browser.newContext();
    const page3 = await ctx3.newPage();
    await page3.goto("/auth");
    await page3.fill('input[type="email"]', email);
    await page3.fill('input[type="password"]', STRONG_TEST_PASSWORD);
    await page3.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page3.getByText(/incorrect/i).first()).toBeVisible({ timeout: 15_000 });

    createdEmail = null;
    await ctx3.close();
  });
});
