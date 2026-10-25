import { test, expect, type BrowserContext } from "@playwright/test";
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
  const data = (await res.json()) as { access_token?: string; session?: { access_token: string } };
  const token = data.access_token ?? data.session?.access_token;
  if (!token) throw new Error("no access token after signup");
  return token;
}

async function createRoom(token: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_focus_room`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_theme: "zen" }),
  });
  if (!res.ok) throw new Error(`create failed: ${res.status}`);
  return (await res.json()) as string;
}

async function renameRoom(token: string, code: string, name: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/rename_focus_room`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_code: code, p_name: name }),
  });
}

async function openGuest(context: BrowserContext, path = "/app") {
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.setItem("calmo_lang", "en");
      localStorage.setItem("calmo_guest_mode", "1");
      localStorage.removeItem("calmo_active_room");
      localStorage.removeItem("calmo_room_name");
      localStorage.removeItem("calmo_visited_rooms");
    } catch {
      /* ignore */
    }
  });
  await page.goto(path);
  return page;
}

test.describe("Active room UX", () => {
  test("link join: strip appears and reconnects after a fresh browser context", async ({ browser }) => {
    test.setTimeout(120_000);
    const email = e2eEmail("active");
    const token = await signUpViaRest(email, STRONG_TEST_PASSWORD);
    const code = await createRoom(token);
    await renameRoom(token, code, "QA Room");
    // eslint-disable-next-line no-console
    console.log(`[active-room] created code=${code}`);

    let ctxA: BrowserContext | null = null;
    let ctxB: BrowserContext | null = null;
    try {
      ctxA = await browser.newContext();
      const pageA = await openGuest(ctxA, `/app/room/${code}`);
      await pageA.getByPlaceholder(/e\.g\./i).fill("Alice");
      await pageA.getByRole("button", { name: /^Join$/ }).click();
      await pageA.getByText("Shared timer").waitFor({ timeout: 15_000 });

      // Preserve storage then open a brand new context against the same tab:
      // simulate "closed PWA and reopened".
      const storage = await ctxA.storageState();
      await ctxA.close();
      ctxA = null;

      ctxB = await browser.newContext({ storageState: storage });
      const pageB = await ctxB.newPage();
      await pageB.goto("/app");
      // Strip should mount with the stored room code.
      const strip = pageB.getByTestId("active-room-strip");
      await strip.waitFor({ timeout: 15_000 });
      await expect(strip).toContainText(/QA Room/);

      // "Open" takes the user back into the room page.
      await pageB.getByTestId("active-room-open").click();
      await pageB.getByText("Shared timer").waitFor({ timeout: 15_000 });
    } finally {
      if (ctxA) await ctxA.close();
      if (ctxB) await ctxB.close();
      await deleteAccountByCredentials(email, STRONG_TEST_PASSWORD);
      const after = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_focus_room`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ p_code: code }),
      });
      const data = (await after.json()) as unknown[];
      expect(Array.isArray(data) ? data.length : 1).toBe(0);
    }
  });

  test("Mis salas: owner sees list, named room shows name, rename works", async ({ browser }) => {
    test.setTimeout(120_000);
    const email = e2eEmail("mis-salas");
    const token = await signUpViaRest(email, STRONG_TEST_PASSWORD);
    const code = await createRoom(token);
    await renameRoom(token, code, "First Room");
    // eslint-disable-next-line no-console
    console.log(`[active-room] mis-salas code=${code}`);

    let ctx: BrowserContext | null = null;
    try {
      ctx = await browser.newContext();
      const page = await ctx.newPage();

      // Sign in via UI so the Supabase session cookie lands locally.
      await page.goto("/auth");
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', STRONG_TEST_PASSWORD);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });

      // My Rooms card shows the named room.
      const myRooms = page.getByTestId("my-rooms-card");
      await myRooms.waitFor();
      await expect(myRooms).toContainText("First Room", { timeout: 15_000 });

      // Rename inline via the dialog.
      await myRooms.getByTestId(`rename-${code}`).click();
      await page.getByTestId("rename-input").fill("Renamed");
      await page.getByTestId("rename-submit").click();
      await expect(myRooms).toContainText("Renamed", { timeout: 10_000 });
    } finally {
      if (ctx) await ctx.close();
      await deleteAccountByCredentials(email, STRONG_TEST_PASSWORD);
    }
  });

  test("central button pauses the room timer (other context sees it within 2s)", async ({ browser }) => {
    test.setTimeout(120_000);
    const email = e2eEmail("central");
    const token = await signUpViaRest(email, STRONG_TEST_PASSWORD);
    const code = await createRoom(token);
    // eslint-disable-next-line no-console
    console.log(`[active-room] central code=${code}`);

    let ctxA: BrowserContext | null = null;
    let ctxB: BrowserContext | null = null;
    try {
      ctxA = await browser.newContext();
      ctxB = await browser.newContext();
      const pageA = await openGuest(ctxA, `/app/room/${code}`);
      const pageB = await openGuest(ctxB, `/app/room/${code}`);
      await pageA.getByPlaceholder(/e\.g\./i).fill("Alice");
      await pageA.getByRole("button", { name: /^Join$/ }).click();
      await pageA.getByText("Shared timer").waitFor({ timeout: 15_000 });
      await pageB.getByPlaceholder(/e\.g\./i).fill("Bob");
      await pageB.getByRole("button", { name: /^Join$/ }).click();
      await pageB.getByText("Shared timer").waitFor({ timeout: 15_000 });

      // Resume on A then both have "Pause" shown in the room's primary CTA.
      await pageA.getByRole("button", { name: /^Resume$/ }).click();
      await expect(pageB.getByRole("button", { name: /^Pause$/ })).toBeVisible({ timeout: 5_000 });

      // Jump back to /app on A and use the central FAB — it should pause the
      // room timer because a room is active.
      await pageA.goto("/app");
      // The FAB button carries aria-label "Pause timer…" when the timer is
      // running. Grab it by that pattern.
      await pageA.getByRole("button", { name: /Pause timer\./ }).click();
      const start = Date.now();
      await expect(pageB.getByRole("button", { name: /^Resume$/ })).toBeVisible({ timeout: 2_500 });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2_000);
    } finally {
      if (ctxA) await ctxA.close();
      if (ctxB) await ctxB.close();
      await deleteAccountByCredentials(email, STRONG_TEST_PASSWORD);
    }
  });

  test("invitee doesn't see rename; strip Leave removes the active room", async ({ browser }) => {
    test.setTimeout(120_000);
    const email = e2eEmail("invitee");
    const token = await signUpViaRest(email, STRONG_TEST_PASSWORD);
    const code = await createRoom(token);
    await renameRoom(token, code, "Owner Room");
    // eslint-disable-next-line no-console
    console.log(`[active-room] invitee code=${code}`);

    let ctx: BrowserContext | null = null;
    try {
      ctx = await browser.newContext();
      const page = await openGuest(ctx, `/app/room/${code}`);
      await page.getByPlaceholder(/e\.g\./i).fill("Visitor");
      await page.getByRole("button", { name: /^Join$/ }).click();
      await page.getByText("Shared timer").waitFor({ timeout: 15_000 });

      // Invitee is not the owner → no rename button.
      await expect(page.getByTestId("room-rename-open")).toHaveCount(0);

      // Wait until the active-room record is actually persisted before the
      // hard navigation; otherwise the strip has nothing to mount from.
      await expect
        .poll(async () => page.evaluate(() => localStorage.getItem("calmo_active_room")), { timeout: 10_000 })
        .not.toBeNull();

      // Navigate back to /app and leave via the strip.
      await page.goto("/app");
      await page.getByTestId("active-room-strip").waitFor({ timeout: 15_000 });
      await page.getByTestId("active-room-leave").click();
      // AlertDialog "Yes, leave" button.
      await page.getByRole("button", { name: /^Yes, leave$/ }).click();
      await expect(page.getByTestId("active-room-strip")).toHaveCount(0, { timeout: 5_000 });
    } finally {
      if (ctx) await ctx.close();
      await deleteAccountByCredentials(email, STRONG_TEST_PASSWORD);
    }
  });
});
