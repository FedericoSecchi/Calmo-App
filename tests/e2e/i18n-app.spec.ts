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
  "Jardín",
  "Sala",
  "Compañero",
];

// English words that should NOT appear in the Spanish UI. The focus is on
// strings that are easy to leave hardcoded (counters, labels, suffixes).
const FORBIDDEN_IN_SPANISH = [
  "Rhythm",
  "Breaks",
  "Water",
  "Exercises",
  "Focus completed",
  "you",
  "Sign in",
  "Sign out",
  "Settings",
  "Today",
  "This week",
  "Garden",
  "Companion",
  "Zen garden",
  "Night sky",
];

async function openGuest(page: Page, lang: "en" | "es") {
  await page.goto("/");
  await page.evaluate((lang) => {
    try {
      localStorage.setItem("calmo_lang", lang);
      localStorage.setItem("calmo_guest_mode", "1");
    } catch {
      /* ignore */
    }
  }, lang);
}

async function assertNoWords(page: Page, path: string, forbidden: string[], label: string) {
  await page.goto(path);
  await page.waitForSelector("main, h1, h2, nav, [role='alert'], [role='dialog']", { timeout: 10_000 }).catch(() => {});
  const text = await page.evaluate(() => document.body.innerText);
  const found = forbidden.filter((word) => {
    const re = new RegExp(`(^|[^\\p{L}])${word}($|[^\\p{L}])`, "u");
    return re.test(text);
  });
  expect.soft(found, `${path} [${label}] leaked words`).toEqual([]);
}

test.describe("App is bilingual (EN mode leaks no hardcoded Spanish)", () => {
  test("every app screen in English", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await openGuest(page, "en");
    await assertNoWords(page, "/app", FORBIDDEN_IN_ENGLISH, "en");
    await assertNoWords(page, "/app/exercises", FORBIDDEN_IN_ENGLISH, "en");
    await assertNoWords(page, "/app/pain", FORBIDDEN_IN_ENGLISH, "en");
    await assertNoWords(page, "/app/settings", FORBIDDEN_IN_ENGLISH, "en");
    await assertNoWords(page, "/onboarding", FORBIDDEN_IN_ENGLISH, "en");
    await assertNoWords(page, "/auth", FORBIDDEN_IN_ENGLISH, "en");
    expect(errors).toEqual([]);
  });

  test("every app screen in Spanish stays Spanish-only", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await openGuest(page, "es");
    await assertNoWords(page, "/app", FORBIDDEN_IN_SPANISH, "es");
    await assertNoWords(page, "/app/exercises", FORBIDDEN_IN_SPANISH, "es");
    await assertNoWords(page, "/app/pain", FORBIDDEN_IN_SPANISH, "es");
    await assertNoWords(page, "/app/settings", FORBIDDEN_IN_SPANISH, "es");
    await assertNoWords(page, "/onboarding", FORBIDDEN_IN_SPANISH, "es");
    await assertNoWords(page, "/auth", FORBIDDEN_IN_SPANISH, "es");
    expect(errors).toEqual([]);
  });
});
