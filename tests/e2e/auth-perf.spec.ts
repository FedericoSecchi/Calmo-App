// Measures login / logout / delete-account durations in a real browser.
// Intentionally kept out of verify.sh (reported in the final write-up, not a
// gating check) because the numbers depend on live Supabase latency.
import { test, expect, type BrowserContext } from "@playwright/test";
import { STRONG_TEST_PASSWORD, deleteAccountByCredentials, e2eEmail } from "./helpers";

test.describe("Auth timing", () => {
  let createdEmail: string | null = null;

  test.afterEach(async () => {
    if (createdEmail) {
      await deleteAccountByCredentials(createdEmail, STRONG_TEST_PASSWORD);
      createdEmail = null;
    }
  });

  test("login/logout/delete under 3s each in a real browser", async ({ browser }) => {
    const email = e2eEmail("perf");
    createdEmail = email;

    const ctx1: BrowserContext = await browser.newContext();
    const page = await ctx1.newPage();

    const signUpStart = Date.now();
    await page.goto("/auth?mode=signup");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', STRONG_TEST_PASSWORD);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 });
    const signUpMs = Date.now() - signUpStart;
    await page.evaluate(() => localStorage.setItem("calmo_onboarding_complete", "1"));

    // Open a second tab in the same context so there's an active auth
    // listener in another frame when we sign out.
    const sidekick = await ctx1.newPage();
    await sidekick.goto("/app");
    await expect(sidekick).toHaveURL(/\/app/, { timeout: 10_000 });

    await page.goto("/app/settings");
    const signOutStart = Date.now();
    await page.getByRole("button", { name: /^sign out$/i }).click();
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
    const signOutMs = Date.now() - signOutStart;
    await sidekick.close();
    await ctx1.close();

    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();

    await page2.goto("/auth");
    const loginStart = Date.now();
    await page2.fill('input[type="email"]', email);
    await page2.fill('input[type="password"]', STRONG_TEST_PASSWORD);
    await page2.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page2).toHaveURL(/\/app/, { timeout: 15_000 });
    const loginMs = Date.now() - loginStart;

    await page2.evaluate(() => localStorage.setItem("calmo_onboarding_complete", "1"));
    await page2.goto("/app/settings");
    const deleteStart = Date.now();
    await page2.getByRole("button", { name: /^delete my account$/i }).click();
    await page2
      .getByRole("alertdialog")
      .getByRole("button", { name: /^delete my account$/i })
      .click();
    await expect(page2).toHaveURL(/\/auth/, { timeout: 15_000 });
    const deleteMs = Date.now() - deleteStart;

    createdEmail = null;
    await ctx2.close();

    // eslint-disable-next-line no-console
    console.log(
      `[auth-perf] signup=${signUpMs}ms login=${loginMs}ms signOut=${signOutMs}ms delete=${deleteMs}ms`,
    );

    expect(signUpMs).toBeLessThan(5_000);
    expect(loginMs).toBeLessThan(3_000);
    expect(signOutMs).toBeLessThan(3_000);
    expect(deleteMs).toBeLessThan(3_000);
  });
});
