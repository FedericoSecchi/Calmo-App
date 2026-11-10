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

/**
 * Calculate streak days from activity logs
 * 
 * Streak Rule:
 * - A day counts toward the streak if the user has at least 1 activity:
 *   - Completed break (from break_logs, including reminder-triggered breaks)
 *   - Logged water glass (from water_logs)
 *   - Logged pain record (local only; not persisted on the server)
 * 
 * Important: A completed REST phase from the Reminders timer logs a break to break_logs
 * with type="reminder", which counts as a valid habit for streak calculation.
 * 
 * Streak is consecutive days from today backwards (inclusive if today has activity).
 * Days are the user's local calendar days (see localDay.ts).
 */
export function calculateStreak(
  breakLogs: ActivityLog[],
  waterLogs: ActivityLog[],
  painLogs: ActivityLog[],
  now: Date = new Date()
): number {
  const activeDays = new Set<string>();
  [...breakLogs, ...waterLogs, ...painLogs].forEach((log) => {
    activeDays.add(localDayKey(log.created_at));
  });

  let streak = 0;
  let day = localDayKey(now);
  while (activeDays.has(day)) {
    streak++;
    day = addLocalDays(day, -1);
  }
  return streak;
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

