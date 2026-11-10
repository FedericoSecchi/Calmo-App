/**
 * One concept of "day" for the whole app: the user's local calendar.
 *
 * Timestamps (created_at, completed_at) stay as UTC ISO strings; they are
 * grouped into days here, in the device's timezone. Never derive a day from
 * toISOString() — that is the UTC day and rolls over at 21:00 in UTC-3.
 */

/** "YYYY-MM-DD" of the local calendar day containing `date`. */
export function localDayKey(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse a "YYYY-MM-DD" key as a local date. Noon, so DST shifts (which happen
 * around midnight in some zones) can never push it into a neighbouring day.
 * `new Date("YYYY-MM-DD")` would parse as UTC midnight — the previous day west
 * of Greenwich.
 */
export function parseLocalDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Shift a "YYYY-MM-DD" key by whole calendar days (negative goes back). */
export function addLocalDays(key: string, days: number): string {
  const d = parseLocalDayKey(key);
  d.setDate(d.getDate() + days);
  return localDayKey(d);
}
