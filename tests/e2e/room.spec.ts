import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { deleteAccountByCredentials, e2eEmail, STRONG_TEST_PASSWORD } from "./helpers";

const SUPABASE_URL = "https://wtquhlfodfqjcggaqxwk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXVobGZvZGZxamNnZ2FxeHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDMwODEsImV4cCI6MjA4MTg3OTA4MX0.JwgGiN2_02cBqFFTA2fF_yjKSiaDBBuzBOHxYuU7vZI";

async function signUpViaRest(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`signup failed: ${res.status}`);
  const data = (await res.json()) as { access_token?: string; session?: { access_token: string } };
  const token = data.access_token ?? data.session?.access_token;
  if (!token) throw new Error("no access token after signup");
  return token;
}

async function createRoomViaRest(token: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_focus_room`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_theme: "zen" }),
  });
  if (!res.ok) throw new Error(`create_focus_room failed: ${res.status}`);
  const code = (await res.json()) as string;
  if (typeof code !== "string" || !/^[a-z0-9]{8}$/.test(code)) {
    throw new Error(`invalid room code: ${JSON.stringify(code)}`);
  }
  return code;
}

async function getRoomCounters(code: string): Promise<Record<string, number>> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_focus_room`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_code: code }),
  });
  if (!res.ok) throw new Error(`get_focus_room failed: ${res.status}`);
  const data = (await res.json()) as Array<Record<string, number>>;
  return data[0] ?? {};
}

async function openRoomAsGuest(context: BrowserContext, code: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`/app/room/${code}`);
  await page.evaluate(() => {
    try {
      localStorage.setItem("calmo_lang", "en");
      localStorage.setItem("calmo_onboarding_complete", "1");
      localStorage.removeItem("calmo_room_name");
    } catch {
      /* ignore */
    }
  });
  await page.goto(`/app/room/${code}`);
  return page;
}

async function enterName(page: Page, name: string) {
  await page.getByPlaceholder(/e\.g\./i).fill(name);
  await page.getByRole("button", { name: /^Join$/ }).click();
  await page.getByText("Shared timer").waitFor({ timeout: 10_000 });
}

test.describe("Focus room", () => {
  test("two browsers in the same room sync pause within 2s and share event counters", async ({ browser }) => {
    test.setTimeout(120_000);
    const email = e2eEmail("room");

    const token = await signUpViaRest(email, STRONG_TEST_PASSWORD);
    const code = await createRoomViaRest(token);
    // eslint-disable-next-line no-console
    console.log(`[room] created code=${code}`);

    let ctxA: BrowserContext | null = null;
    let ctxB: BrowserContext | null = null;
    try {
      ctxA = await browser.newContext();
      ctxB = await browser.newContext();
      const pageA = await openRoomAsGuest(ctxA, code);
      const pageB = await openRoomAsGuest(ctxB, code);
      await enterName(pageA, "Alice");
      await enterName(pageB, "Bob");

      // Each side must see the other in the presence list.
      await expect(pageA.getByText("Bob")).toBeVisible({ timeout: 15_000 });
      await expect(pageB.getByText("Alice")).toBeVisible({ timeout: 15_000 });

      // Both start paused. A resumes, B's primary button flips to Pause.
      await pageA.getByRole("button", { name: /^Resume$/ }).click();
      await expect(pageB.getByRole("button", { name: /^Pause$/ })).toBeVisible({ timeout: 5_000 });

      // A pauses, B flips back within 2s.
      await pageA.getByRole("button", { name: /^Pause$/ }).click();
      const start = Date.now();
      await expect(pageB.getByRole("button", { name: /^Resume$/ })).toBeVisible({ timeout: 2_500 });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2_000);

      // B logs an exercise; get_focus_room should reflect it on both sides.
      await pageB.locator("button:has-text('Exercises')").click();
      await expect(pageA.locator("button:has-text('Exercises')")).toContainText("1", { timeout: 8_000 });

      const counters = await getRoomCounters(code);
      expect(counters.exercise_count).toBeGreaterThanOrEqual(1);
    } finally {
      if (ctxA) await ctxA.close();
      if (ctxB) await ctxB.close();
      await deleteAccountByCredentials(email, STRONG_TEST_PASSWORD);
      // The room (and its events) must cascade-delete with the creator.
      // get_focus_room returns an empty array when the code is gone.
      const after = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_focus_room`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_code: code }),
      });
      const afterData = (await after.json()) as unknown[];
      expect(
        Array.isArray(afterData) ? afterData.length : 1,
        `room ${code} should cascade-delete when the creator's account is removed`,
      ).toBe(0);
    }
  });
});
