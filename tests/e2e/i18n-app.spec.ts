import { test, expect, type Page } from "@playwright/test";

// Spanish words that should NOT appear in the English UI anywhere inside the
// authenticated app. Keyed on short, high-signal strings that only make sense
// in Spanish (not loanwords, not brand names).
const FORBIDDEN_IN_ENGLISH = [
  "Pausas",
  "Pausa",
  "Racha",
  "Guardar",
  "Ejercicio",
  "Ejercicios",
  "Dolor",
  "vasos",
  "Vasos",
  "Hoy",
  "Cerrar sesión",
  "Modo invitado",
  "Idioma",
  "Movilidad",
  "Trabajo",
  "Descanso",
  "Avanzado",
  "Ajustes",
  "Recordatorios",
  "Instalar",
  "Siguiente",
  "Continuar",
];

async function openGuestInEnglish(page: Page) {
  await page.goto("/");
  // Set language and guest flag before any app code runs
  await page.evaluate(() => {
    try {
      localStorage.setItem("calmo_lang", "en");
      localStorage.setItem("calmo_guest_mode", "1");
    } catch {
      /* ignore */
    }
  });
}

async function assertNoSpanish(page: Page, path: string) {
  await page.goto(path);
  // Wait for the main content to be present
  await page.waitForSelector("main, h1, h2, nav, [role='alert'], [role='dialog']", { timeout: 10_000 }).catch(() => {});
  const text = await page.evaluate(() => document.body.innerText);
  const found = FORBIDDEN_IN_ENGLISH.filter((word) => {
    // Word-boundary-ish match: ensure not inside a larger token.
    const re = new RegExp(`(^|[^\\p{L}])${word}($|[^\\p{L}])`, "u");
    return re.test(text);
  });
  expect
    .soft(found, `${path} leaked Spanish words into the English UI`)
    .toEqual([]);
}

test.describe("App is bilingual (EN mode leaks no hardcoded Spanish)", () => {
  test("every app screen in English", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await openGuestInEnglish(page);
    await assertNoSpanish(page, "/app");
    await assertNoSpanish(page, "/app/exercises");
    await assertNoSpanish(page, "/app/reminders");
    await assertNoSpanish(page, "/app/pain");
    await assertNoSpanish(page, "/app/settings");
    await assertNoSpanish(page, "/onboarding");
    await assertNoSpanish(page, "/auth");
    expect(errors).toEqual([]);
  });
});
