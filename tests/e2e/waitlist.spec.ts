import { test, expect, type Page, type Request } from "@playwright/test";

// Submit via ?source=e2e so rows show up with source "e2e" in the waitlist
// table and can be filtered out of real analytics.
//
// Bot filters (client side): a hidden trap field and a 3 s minimum between
// the form being shown and the submit. Bots get the same success message but
// nothing is inserted. "No new row" is asserted at the network level: the
// only way the landing writes to `waitlist` is a POST to /rest/v1/waitlist.

const EMAIL_INPUT = 'input[type="email"][aria-label*="waitlist" i], input[type="email"][aria-label*="espera" i]';
const SUBMIT = /notify me|avísame|avisame/i;
const SUCCESS = /on the list|en la lista/i;
const HUMAN_DELAY_MS = 3_500;

function watchWaitlistInserts(page: Page): Request[] {
  const posts: Request[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().includes("/rest/v1/waitlist")) posts.push(req);
  });
  return posts;
}

async function openPricing(page: Page) {
  await page.goto("/?source=e2e");
  await page.locator("#pricing").scrollIntoViewIfNeeded();
  await expect(page.locator(EMAIL_INPUT)).toBeVisible();
}

test("waitlist: a person who waits ≥3 s is stored with source e2e (new and duplicate)", async ({ page }) => {
  const email = `e2e+${Date.now()}@calmo.fit`;
  const posts = watchWaitlistInserts(page);

  for (let i = 0; i < 2; i++) {
    await openPricing(page);
    await page.waitForTimeout(HUMAN_DELAY_MS);
    await page.locator(EMAIL_INPUT).fill(email);
    const response = page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().includes("/rest/v1/waitlist")
    );
    await page.getByRole("button", { name: SUBMIT }).click();
    // First insert → 201; duplicate → 409 (unique email), shown as success.
    expect([201, 409]).toContain((await response).status());
    await expect(page.getByText(SUCCESS)).toBeVisible({ timeout: 15_000 });
  }

  expect(posts).toHaveLength(2);
  for (const p of posts) {
    expect(p.postDataJSON()).toMatchObject({ email, source: "e2e" });
  }
});

test("waitlist: filling the hidden trap field shows success but inserts nothing", async ({ page }) => {
  const posts = watchWaitlistInserts(page);
  await openPricing(page);
  await page.waitForTimeout(HUMAN_DELAY_MS); // only the trap should trigger

  const trap = page.locator('input[name="website"]');
  await expect(trap).toHaveAttribute("tabindex", "-1");
  await expect(trap).toHaveAttribute("autocomplete", "off");
  await expect(trap.locator("xpath=ancestor::*[@aria-hidden='true']")).toHaveCount(1);
  await trap.fill("https://spam.example", { force: true });

  await page.locator(EMAIL_INPUT).fill(`e2e+trap-${Date.now()}@calmo.fit`);
  await page.getByRole("button", { name: SUBMIT }).click();
  await expect(page.getByText(SUCCESS)).toBeVisible();
  await page.waitForTimeout(1_000);
  expect(posts).toHaveLength(0);
});

test("waitlist: submitting in under 3 s shows success but inserts nothing", async ({ page }) => {
  const posts = watchWaitlistInserts(page);
  await openPricing(page);

  await page.locator(EMAIL_INPUT).fill(`e2e+fast-${Date.now()}@calmo.fit`);
  await page.getByRole("button", { name: SUBMIT }).click();
  await expect(page.getByText(SUCCESS)).toBeVisible();
  await page.waitForTimeout(1_000);
  expect(posts).toHaveLength(0);
});
