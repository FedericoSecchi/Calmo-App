import { describe, it, expect } from "vitest";
import { addLocalDays, localDayKey, parseLocalDayKey } from "./localDay";

// These tests run under several TZ values (scripts/test-timezones.sh).
// Dates built with the local constructor mean "that wall-clock time wherever
// the test runs"; ISO strings with an offset pin an absolute instant.
const TZ = process.env.TZ ?? "";

describe("localDayKey", () => {
  it("23:30 local belongs to the same local day", () => {
    expect(localDayKey(new Date(2026, 10, 4, 23, 30))).toBe("2026-11-04");
  });

  it("00:30 local belongs to the new local day", () => {
    expect(localDayKey(new Date(2026, 10, 5, 0, 30))).toBe("2026-11-05");
  });

  it("accepts ISO strings (stored created_at) and groups them in local time", () => {
    const iso = new Date(2026, 10, 4, 23, 30).toISOString();
    expect(localDayKey(iso)).toBe("2026-11-04");
  });

  it("pads single-digit months and days", () => {
    expect(localDayKey(new Date(2026, 0, 3, 12))).toBe("2026-01-03");
  });

  it.runIf(TZ === "America/Argentina/Buenos_Aires")(
    "Argentina: 23:30 local (02:30 UTC next day) stays on the local day",
    () => {
      expect(localDayKey("2026-11-05T02:30:00.000Z")).toBe("2026-11-04");
    },
  );

  it.runIf(TZ === "Europe/Zagreb")("Zagreb: 00:30 local (23:30 UTC previous day) is the new day", () => {
    expect(localDayKey("2026-11-04T23:30:00.000Z")).toBe("2026-11-05");
  });

  it.runIf(TZ === "Pacific/Auckland")("Auckland: 09:00 local is the UTC previous evening", () => {
    expect(localDayKey("2026-11-04T20:00:00.000Z")).toBe("2026-11-05");
  });
});

describe("parseLocalDayKey", () => {
  it("round-trips with localDayKey (not parsed as UTC midnight)", () => {
    for (const key of ["2026-01-01", "2026-03-29", "2026-10-25", "2026-12-31"]) {
      expect(localDayKey(parseLocalDayKey(key))).toBe(key);
    }
  });
});

describe("addLocalDays", () => {
  it("moves across month and year boundaries", () => {
    expect(addLocalDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addLocalDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("European DST end (last Sunday of October) neither repeats nor skips a day", () => {
    expect(addLocalDays("2026-10-26", -1)).toBe("2026-10-25");
    expect(addLocalDays("2026-10-25", -1)).toBe("2026-10-24");
    expect(addLocalDays("2026-10-24", 2)).toBe("2026-10-26");
  });

  it("DST start (Europe March, Auckland April/September) neither repeats nor skips", () => {
    expect(addLocalDays("2026-03-30", -1)).toBe("2026-03-29");
    expect(addLocalDays("2026-03-29", -1)).toBe("2026-03-28");
    expect(addLocalDays("2026-04-06", -2)).toBe("2026-04-04");
    expect(addLocalDays("2026-09-28", -2)).toBe("2026-09-26");
  });

  it("walking back 400 days one at a time hits 400 distinct days", () => {
    const seen = new Set<string>();
    let day = "2026-12-31";
    for (let i = 0; i < 400; i++) {
      seen.add(day);
      day = addLocalDays(day, -1);
    }
    expect(seen.size).toBe(400);
    expect(day).toBe(addLocalDays("2026-12-31", -400));
  });
});
