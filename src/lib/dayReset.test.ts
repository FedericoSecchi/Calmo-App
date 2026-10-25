import { describe, it, expect } from "vitest";
import { getLocalDayString, shouldAutoResetDay } from "./dayReset";

describe("getLocalDayString", () => {
  it("formats as YYYY-MM-DD in local time", () => {
    const d = new Date(2026, 9, 25, 23, 59, 59); // Oct 25, 2026 local
    expect(getLocalDayString(d)).toBe("2026-10-25");
  });

  it("pads single-digit months and days", () => {
    const d = new Date(2026, 0, 3, 12, 0, 0);
    expect(getLocalDayString(d)).toBe("2026-01-03");
  });

  it("uses local time, not UTC — late evening on Jan 1 does not roll to Jan 2", () => {
    const d = new Date(2026, 0, 1, 23, 30, 0);
    expect(getLocalDayString(d)).toBe("2026-01-01");
  });
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
