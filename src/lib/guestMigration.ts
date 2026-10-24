import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

const WATER_KEY = "calmo_water_logs";
const BREAKS_KEY = "calmo_break_logs";
const ADJUST_KEY = "calmo_manual_break_adjustments";
const EXERCISES_KEY = "calmo_exercise_completions";
const DONE_KEY = "calmo_guest_migrated_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function migrateGuestDataToServer(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(DONE_KEY)) return;

    const waterDates = safeParse<string[]>(window.localStorage.getItem(WATER_KEY), []);
    if (waterDates.length > 0) {
      const rows = waterDates.slice(0, 500).map((created_at) => ({ user_id: userId, created_at }));
      await supabase.from("water_logs").insert(rows);
    }

    const breakDates = safeParse<string[]>(window.localStorage.getItem(BREAKS_KEY), []);
    if (breakDates.length > 0) {
      const rows = breakDates.slice(0, 500).map((created_at) => ({ user_id: userId, type: "reminder" as const, created_at }));
      await supabase.from("break_logs").insert(rows);
    }

    const adjustments = safeParse<Record<string, number>>(window.localStorage.getItem(ADJUST_KEY), {});
    const adjRows = Object.entries(adjustments).map(([date, adjustment]) => ({
      user_id: userId,
      date,
      adjustment,
    }));
    if (adjRows.length > 0) {
      await supabase.from("manual_break_adjustments").upsert(adjRows, { onConflict: "user_id,date" });
    }

    const exercises = safeParse<Array<{ exercise_id: string; completed_at: string }>>(
      window.localStorage.getItem(EXERCISES_KEY),
      []
    );
    if (exercises.length > 0) {
      const rows = exercises.slice(0, 1000).map((e) => ({
        user_id: userId,
        exercise_id: e.exercise_id,
        completed_at: e.completed_at,
      }));
      await supabase.from("exercise_completions").insert(rows);
    }

    window.localStorage.setItem(DONE_KEY, "1");
    window.localStorage.removeItem(WATER_KEY);
    window.localStorage.removeItem(BREAKS_KEY);
    window.localStorage.removeItem(ADJUST_KEY);
    window.localStorage.removeItem(EXERCISES_KEY);
  } catch {
    /* best-effort */
  }
}

export function clearLocalCalmoData(): void {
  if (typeof window === "undefined") return;
  const prefixes = ["calmo_"];
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && prefixes.some((p) => key.startsWith(p))) {
      keys.push(key);
    }
  }
  keys.forEach((k) => window.localStorage.removeItem(k));
}
