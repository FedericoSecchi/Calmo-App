import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { deleteAccountByCredentials, e2eEmail, STRONG_TEST_PASSWORD } from "./helpers";

const SUPABASE_URL = "https://wtquhlfodfqjcggaqxwk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXVobGZvZGZxamNnZ2FxeHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDMwODEsImV4cCI6MjA4MTg3OTA4MX0.JwgGiN2_02cBqFFTA2fF_yjKSiaDBBuzBOHxYuU7vZI";

async function signUpViaRest(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`signup failed: ${res.status}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("no access token after signup");
  return data.access_token;
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

async function deleteRoomViaRest(token: string, code: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_focus_room`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_code: code }),
  });
}

async function openGuestRoom(ctx: BrowserContext, code: string, name: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.clear();
      localStorage.setItem("calmo_lang", "en");
      localStorage.setItem("calmo_guest_mode", "1");
      localStorage.setItem("calmo_onboarding_complete", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto(`/app/room/${code}`);
  await page.getByPlaceholder(/e\.g\./i).fill(name);
  await page.getByRole("button", { name: /^Join$/ }).click();
  await page.getByText("Shared timer").waitFor({ timeout: 10_000 });
  return page;
}

test.describe("Room custom rhythm sync", () => {
  test("one browser sets custom 20/3 and the other sees 20:00 within 2s; Home panel drives the room rhythm", async ({ browser }) => {
    test.setTimeout(120_000);
    const email = e2eEmail("custom-rhythm");
    const token = await signUpViaRest(email, STRONG_TEST_PASSWORD);
    const code = await createRoomViaRest(token);
    // eslint-disable-next-line no-console
    console.log(`[room-custom] created code=${code}`);

    let ctxA: BrowserContext | null = null;
    let ctxB: BrowserContext | null = null;
    try {
      ctxA = await browser.newContext();
      ctxB = await browser.newContext();
      const pageA = await openGuestRoom(ctxA, code, "Alice");
      const pageB = await openGuestRoom(ctxB, code, "Bob");

      // Both start paused — this is the condition for rhythm changes.
      await pageA.getByTestId("room-rhythm-advanced-toggle").click();
      await pageA.getByTestId("room-rhythm-work-input").fill("20");
      await pageA.getByTestId("room-rhythm-rest-input").fill("3");
      await pageA.getByTestId("room-rhythm-apply-custom").click();

      const start = Date.now();
      await expect(pageB.getByText("20:00").first()).toBeVisible({ timeout: 2_500 });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2_000);

      // Home rhythm panel on B now controls the room rhythm. Switch to the
      // 90-min preset from Home and verify the room timer picks it up.
      await pageB.goto("/app");
      await pageB.waitForSelector("main, h1", { timeout: 10_000 });
      await pageB.getByRole("button", { name: /Timer settings/i }).click();
      // Dashboard shows the room-aware rhythm controls when a room is active.
      await expect(pageB.getByTestId("dashboard-rhythm-panel")).toContainText(/Room rhythm/i);
      await pageB.getByTestId("room-rhythm-focus").click();
      // A's room now sees 90:00.
      await expect(pageA.getByText("90:00").first()).toBeVisible({ timeout: 5_000 });

      // Personal preset (persisted) was NOT touched — still "standard" default.
      const personalPreset = await pageB.evaluate(() => {
        try {
          const raw = localStorage.getItem("calmo_reminder_timer_state");
          if (!raw) return null;
          return (JSON.parse(raw) as { presetId?: string }).presetId ?? null;
        } catch {
          return null;
        }
      });
      expect(personalPreset).toBe("standard");
    } finally {
      if (ctxA) await ctxA.close();
      if (ctxB) await ctxB.close();
      await deleteRoomViaRest(token, code);
      await deleteAccountByCredentials(email, STRONG_TEST_PASSWORD);
    }
  });
});
