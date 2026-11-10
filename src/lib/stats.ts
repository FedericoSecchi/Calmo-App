/**
 * Stats calculation utilities
 * Used for computing streak and aggregating daily stats
 */

import { addLocalDays, localDayKey } from "./localDay";

export interface ActivityLog {
  created_at: string;
}

/** Days shown under "This week": today plus the 6 previous local days. */
export const WEEK_DAYS = 7;

export interface StreakStatus {
  /** Consecutive local days with activity (see calculateStreakStatus). */
  days: number;
  /** True when the streak is alive but today has no activity yet. */
  needsToday: boolean;
}

/**
 * Streak of consecutive local days with activity.
 *
 * A day counts if it has at least 1 activity:
 *   - Completed break (break_logs, including reminder-triggered breaks and
 *     manual adjustments logged there)
 *   - Logged water glass (water_logs)
 *   - Logged pain record (local only; not persisted on the server)
 *
 * The run ends TODAY if today already has activity, otherwise it ends
 * YESTERDAY: the streak only breaks after a full local day with no activity,
 * so it doesn't read 0 every morning. In that second case `needsToday` is
 * true (the UI nudges the user to keep it).
 *
 * Days are the user's local calendar days (see localDay.ts).
 */
export function calculateStreakStatus(
  breakLogs: ActivityLog[],
  waterLogs: ActivityLog[],
  painLogs: ActivityLog[],
  now: Date = new Date()
): StreakStatus {
  const activeDays = new Set<string>();
  [...breakLogs, ...waterLogs, ...painLogs].forEach((log) => {
    activeDays.add(localDayKey(log.created_at));
  });

  const today = localDayKey(now);
  const todayActive = activeDays.has(today);
  let day = todayActive ? today : addLocalDays(today, -1);
  let days = 0;
  while (activeDays.has(day)) {
    days++;
    day = addLocalDays(day, -1);
  }
  return { days, needsToday: days > 0 && !todayActive };
}

/** Streak length only. Same rule as calculateStreakStatus. */
export function calculateStreak(
  breakLogs: ActivityLog[],
  waterLogs: ActivityLog[],
  painLogs: ActivityLog[],
  now: Date = new Date()
): number {
  return calculateStreakStatus(breakLogs, waterLogs, painLogs, now).days;
}

/**
 * Get count of activities for today (local day)
 */
export function getTodayCount(logs: ActivityLog[], now: Date = new Date()): number {
  const today = localDayKey(now);
  return logs.filter((log) => localDayKey(log.created_at) === today).length;
}

/**
 * Get count of activities for "this week": the last WEEK_DAYS local days,
 * today included.
 */
export function getWeekCount(logs: ActivityLog[], now: Date = new Date()): number {
  const today = localDayKey(now);
  const firstDay = addLocalDays(today, -(WEEK_DAYS - 1));
  return logs.filter((log) => {
    const day = localDayKey(log.created_at);
    return day >= firstDay && day <= today;
  }).length;
}

/**
 * Get most recent pain record
 */
export interface PainRecord {
  intensity: number;
  area: string;
  created_at: string;
}

export function getLastPain(painRecords: Array<{ intensity: number; area: string; created_at: string }>): {
  intensity: number;
  area: string;
  time: string;
} | null {
  if (painRecords.length === 0) {
    return null;
  }

  // Sort by created_at descending and get first
  const sorted = [...painRecords].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latest = sorted[0];

  return {
    intensity: latest.intensity,
    area: latest.area,
    time: new Date(latest.created_at).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

