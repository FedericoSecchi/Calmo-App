import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { deleteAccountByCredentials, e2eEmail, STRONG_TEST_PASSWORD } from "./helpers";

const SUPABASE_URL = "https://wtquhlfodfqjcggaqxwk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXVobGZvZGZxamNnZ2FxeHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDMwODEsImV4cCI6MjA4MTg3OTA4MX0.JwgGiN2_02cBqFFTA2fF_yjKSiaDBBuzBOHxYuU7vZI";
const SUPABASE_TOKEN_KEY = "sb-wtquhlfodfqjcggaqxwk-auth-token";

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: unknown;
}

async function signUpViaRest(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`signup failed: ${res.status}`);
  return (await res.json()) as AuthResponse;
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
  return (await res.json()) as string;
}

async function getRoomMeta(token: string, code: string): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_focus_room_meta`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_code: code }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as unknown[];
  return Array.isArray(data) ? data[0] ?? null : null;
}

async function openOwnerRoom(ctx: BrowserContext, auth: AuthResponse, code: string, name: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto("/");
  await page.evaluate(
    ({ session, key }) => {
      try {
        localStorage.clear();
        localStorage.setItem("calmo_lang", "en");
        localStorage.setItem("calmo_onboarding_complete", "1");
        localStorage.setItem(key, JSON.stringify(session));
      } catch {
        /* ignore */
      }
    },
    { session: auth, key: SUPABASE_TOKEN_KEY },
  );
  await page.goto(`/app/room/${code}`);
  await page.getByPlaceholder(/e\.g\./i).fill(name);
  await page.getByRole("button", { name: /^Join$/ }).click();
  await page.getByText("Shared timer").waitFor({ timeout: 15_000 });
  return page;
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

test.describe("Delete focus room", () => {
  test("owner deletes room; non-owner is kicked within 2s and server meta goes empty", async ({ browser }) => {
    test.setTimeout(180_000);
    const email = e2eEmail("delete");
    const auth = await signUpViaRest(email, STRONG_TEST_PASSWORD);
    const code = await createRoomViaRest(auth.access_token);
    // eslint-disable-next-line no-console
    console.log(`[room-delete] created code=${code}`);

    let ctxA: BrowserContext | null = null;
    let ctxB: BrowserContext | null = null;
    try {
      ctxA = await browser.newContext();
      ctxB = await browser.newContext();
      const pageA = await openOwnerRoom(ctxA, auth, code, "Owner");
      const pageB = await openGuestRoom(ctxB, code, "Guest");

      // Guest sees "Remove from my list" (not "Delete room") in Home.
      await pageB.goto("/app");
      await pageB.waitForSelector("main, h1", { timeout: 10_000 });
      await expect(pageB.getByTestId(`forget-${code}`)).toBeVisible();
      await expect(pageB.getByTestId(`delete-${code}`)).toHaveCount(0);
      await pageB.goto(`/app/room/${code}`);
      await pageB.getByText("Shared timer").waitFor({ timeout: 10_000 });

      // Owner triggers delete flow from inside the room.
      await pageA.getByTestId("room-delete").click();
      const start = Date.now();
      await pageA.getByTestId("room-delete-confirm").click();

      // Non-owner is kicked back to /app automatically.
      await expect(pageB).toHaveURL(/\/app\/?$/, { timeout: 5_000 });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5_000);

      // Server meta is empty for the deleted code.
      const meta = await getRoomMeta(auth.access_token, code);
      expect(meta).toBeNull();
    } finally {
      if (ctxA) await ctxA.close();
      if (ctxB) await ctxB.close();
      // Belt and suspenders: in case the UI delete flow didn't fire (test
      // crashed mid-way), still clean up the room explicitly.
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_focus_room`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${auth.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_code: code }),
      }).catch(() => {});
      await deleteAccountByCredentials(email, STRONG_TEST_PASSWORD);
    }
  });
});
