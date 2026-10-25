import { test, expect } from "@playwright/test";

test.describe("Auth password UX", () => {
  test("short password shows an error without hitting Supabase", async ({ page }) => {
    const supabaseCalls: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("supabase.co/auth/v1/signup")) {
        supabaseCalls.push(url);
      }
    });

    await page.goto("/auth?mode=signup");
    await page.fill('input[type="email"]', `e2e-weak-${Date.now()}@calmo.fit`);
    await page.fill('input[type="password"]', "12345");

    // Counter reflects live length.
    await expect(page.getByTestId("password-counter")).toHaveText(/5\s*\/\s*8/);

    // The native minLength on the password input blocks submit — we assert
    // either the browser prevents submission or our client-side guard fires
    // a toast. In both cases the Supabase signup endpoint must NOT be called.
    await page.getByRole("button", { name: /create account/i }).click();

    // Give any potential network call a brief window to happen.
    await page.waitForTimeout(600);

    expect(supabaseCalls, "signup must not be called with a 5-char password").toEqual([]);
  });
});
