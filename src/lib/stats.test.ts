import { describe, it, expect, afterEach, vi } from "vitest";
import { calculateStreak, getTodayCount, getWeekCount, getLastPain } from "./stats";

// Fixed local wall-clock times: every assertion holds in any TZ
// (scripts/test-timezones.sh runs this file under several zones).
const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  ({ created_at: new Date(y, m - 1, d, h, min).toISOString() });

afterEach(() => {
  vi.useRealTimers();
});

describe("calculateStreak", () => {
  const now = new Date(2026, 10, 9, 18, 0); // Nov 9, 2026 18:00 local

  it("returns 0 when no activities exist", () => {
    expect(calculateStreak([], [], [], now)).toBe(0);
  });

  it("calculates streak from today backwards", () => {
    expect(calculateStreak([at(2026, 11, 9)], [at(2026, 11, 8)], [at(2026, 11, 7)], now)).toBe(3);
  });

  it("stops streak when gap is found", () => {
    expect(calculateStreak([at(2026, 11, 9)], [at(2026, 11, 8)], [at(2026, 11, 6)], now)).toBe(2);
  });

  it("is 0 when today has no activity yet (existing rule, unchanged)", () => {
    expect(calculateStreak([at(2026, 11, 8)], [], [], now)).toBe(0);
  });

  it("handles multiple activities on same day", () => {
    expect(calculateStreak([at(2026, 11, 9), at(2026, 11, 9, 9)], [at(2026, 11, 9)], [], now)).toBe(1);
  });

  it("3-day streak with nightly activity (22:00–23:59) does not break", () => {
    // In Argentina (UTC-3) every one of these is already the next UTC day.
    const logs = [at(2026, 11, 7, 22, 0), at(2026, 11, 8, 23, 59), at(2026, 11, 9, 22, 30)];
    const lateNow = new Date(2026, 10, 9, 23, 45);
    expect(calculateStreak(logs, [], [], lateNow)).toBe(3);
  });

  it("activity at 00:30 counts for the new day, 23:30 for the previous one", () => {
    const logs = [at(2026, 11, 8, 23, 30), at(2026, 11, 9, 0, 30)];
    expect(calculateStreak(logs, [], [], new Date(2026, 10, 9, 1, 0))).toBe(2);
  });

  it("European DST end (Sun Oct 25, 2026) neither duplicates nor skips a day", () => {
    const logs = [at(2026, 10, 24, 23, 30), at(2026, 10, 25, 2, 30), at(2026, 10, 26, 0, 30)];
    expect(calculateStreak(logs, [], [], new Date(2026, 9, 26, 9, 0))).toBe(3);
    // Missing the DST day itself must break the streak.
    const gap = [at(2026, 10, 24, 23, 30), at(2026, 10, 26, 0, 30)];
    expect(calculateStreak(gap, [], [], new Date(2026, 9, 26, 9, 0))).toBe(1);
  });

  it("uses the system clock when `now` is omitted", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 9, 23, 30));
    expect(calculateStreak([at(2026, 11, 9, 22)], [at(2026, 11, 8, 23)], [])).toBe(2);
  });
});

describe("getTodayCount", () => {
  it("returns 0 when no logs exist", () => {
    expect(getTodayCount([], new Date(2026, 10, 9))).toBe(0);
  });

  it("counts only today's logs", () => {
    const logs = [at(2026, 11, 9, 8), at(2026, 11, 9, 20), at(2026, 11, 8, 20)];
    expect(getTodayCount(logs, new Date(2026, 10, 9, 21))).toBe(2);
  });

  it("23:30 counts for today; at 00:30 it no longer does", () => {
    const logs = [at(2026, 11, 9, 23, 30)];
    expect(getTodayCount(logs, new Date(2026, 10, 9, 23, 45))).toBe(1);
    expect(getTodayCount(logs, new Date(2026, 10, 10, 0, 30))).toBe(0);
    expect(getTodayCount([at(2026, 11, 10, 0, 30)], new Date(2026, 10, 10, 0, 45))).toBe(1);
  });
});

describe("getWeekCount (this week = today + previous 6 local days)", () => {
  const daily = (from: [number, number, number], days: number, h: number) =>
    Array.from({ length: days }, (_, i) => at(from[0], from[1], from[2] + i, h));

  it("counts exactly 7 local days, nightly logs included", () => {
    const logs = daily([2026, 11, 1], 9, 23); // Nov 1..9 at 23:00
    expect(getWeekCount(logs, new Date(2026, 10, 9, 23, 30))).toBe(7);
  });

  it("does not count future days", () => {
    expect(getWeekCount([at(2026, 11, 10, 0, 30)], new Date(2026, 10, 9, 23, 30))).toBe(0);
  });

  it("spans the European DST change without gaining or losing a day", () => {
    const logs = daily([2026, 10, 20], 10, 0); // Oct 20..29 at 00:00 local
    expect(getWeekCount(logs, new Date(2026, 9, 28, 12))).toBe(7); // Oct 22..28
  });

  it("matches the sum of the 7 daily counts (today/week coherence)", () => {
    const logs = daily([2026, 10, 18], 14, 23).concat(daily([2026, 10, 18], 14, 0));
    const now = new Date(2026, 9, 29, 12);
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += getTodayCount(logs, new Date(2026, 9, 29 - i, 12));
    expect(getWeekCount(logs, now)).toBe(sum);
  });
});

describe("getLastPain", () => {
  it("returns null when no pain records exist", () => {
    expect(getLastPain([])).toBeNull();
  });

  it("returns most recent pain record", () => {
    const older = new Date();
    older.setHours(older.getHours() - 2);
    const newer = new Date();
    newer.setHours(newer.getHours() - 1);

    const records = [
      { intensity: 3, area: "lumbar", created_at: older.toISOString() },
      { intensity: 5, area: "cervical", created_at: newer.toISOString() },
    ];

    const result = getLastPain(records);
    expect(result).not.toBeNull();
    expect(result?.intensity).toBe(5);
    expect(result?.area).toBe("cervical");
  });

  it("formats time correctly", () => {
    const now = new Date();
    const records = [
      { intensity: 3, area: "lumbar", created_at: now.toISOString() },
    ];

    const result = getLastPain(records);
    expect(result?.time).toMatch(/\d{2}:\d{2}/);
  });
});

