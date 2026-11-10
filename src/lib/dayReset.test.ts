import { describe, it, expect } from "vitest";
import { shouldAutoResetDay } from "./dayReset";
import { localDayKey } from "./localDay";
import { getTodayCount } from "./stats";

describe("day reset vs. today counter", () => {
  // Walk every 15 min across Oct 24–27, 2026 (includes the European DST end)
  // and Nov 8–10 (Argentina nights). Each step logs one activity; at the next
  // step, the timer's "new day" reset must fire exactly when that activity
  // stops counting for today.
  const walk = (start: Date, hours: number) => {
    const steps: Date[] = [];
    for (let t = start.getTime(); t <= start.getTime() + hours * 3600_000; t += 15 * 60_000) {
      steps.push(new Date(t));
    }
    return steps;
  };

  for (const [label, start, hours] of [
    ["DST week", new Date(2026, 9, 24, 0, 0), 96],
    ["late nights", new Date(2026, 10, 8, 18, 0), 54],
  ] as const) {
    it(`reset and today-count agree (${label})`, () => {
      const steps = walk(start, hours);
      let resets = 0;
      for (let i = 1; i < steps.length; i++) {
        const prev = steps[i - 1];
        const now = steps[i];
        const reset = shouldAutoResetDay({
          storedDay: localDayKey(prev),
          currentDay: localDayKey(now),
          isRunning: false,
        });
        const stillToday = getTodayCount([{ created_at: prev.toISOString() }], now) === 1;
        expect(reset).toBe(!stillToday);
        if (reset) {
          resets++;
          expect(now.getHours()).toBe(0);
        }
      }
      // One reset per local midnight crossed (DST days are 23 or 25 h long).
      const midnights = steps.slice(1).filter((d) => d.getHours() === 0 && d.getMinutes() === 0).length;
      expect(midnights).toBeGreaterThan(0);
      expect(resets).toBe(midnights);
    });
  }
});

describe("shouldAutoResetDay", () => {
  it("resets when the stored day is behind today and the timer is stopped", () => {
    expect(
      shouldAutoResetDay({
        storedDay: "2026-10-24",
        currentDay: "2026-10-25",
        isRunning: false,
      }),
    ).toBe(true);
  });

  it("does not reset when the timer is running — even if the day changed", () => {
    expect(
      shouldAutoResetDay({
        storedDay: "2026-10-24",
        currentDay: "2026-10-25",
        isRunning: true,
      }),
    ).toBe(false);
  });

  it("does not reset when the stored day matches today", () => {
    expect(
      shouldAutoResetDay({
        storedDay: "2026-10-25",
        currentDay: "2026-10-25",
        isRunning: false,
      }),
    ).toBe(false);
  });

  it("does not reset when there is no stored day yet (first launch)", () => {
    expect(
      shouldAutoResetDay({
        storedDay: null,
        currentDay: "2026-10-25",
        isRunning: false,
      }),
    ).toBe(false);
  });

  it("resets when the stored day is from a previous year", () => {
    expect(
      shouldAutoResetDay({
        storedDay: "2025-12-31",
        currentDay: "2026-01-01",
        isRunning: false,
      }),
    ).toBe(true);
  });
});
