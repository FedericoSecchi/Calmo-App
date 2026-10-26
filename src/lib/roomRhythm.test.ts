import { describe, it, expect } from "vitest";
import { rhythmFromFocusSec, ROOM_RHYTHMS } from "@/hooks/useFocusRoom";

describe("rhythmFromFocusSec", () => {
  it("maps 25 minutes to the light preset", () => {
    expect(rhythmFromFocusSec(25 * 60).id).toBe("light");
  });

  it("maps 45 minutes to the standard preset", () => {
    expect(rhythmFromFocusSec(45 * 60).id).toBe("standard");
  });

  it("maps 90 minutes to the focus preset", () => {
    expect(rhythmFromFocusSec(90 * 60).id).toBe("focus");
  });

  it("tags a legacy 60-minute room as custom and preserves its durations", () => {
    const r = rhythmFromFocusSec(60 * 60, 10 * 60);
    expect(r.id).toBe("custom");
    expect(r.focusSec).toBe(60 * 60);
    expect(r.breakSec).toBe(10 * 60);
  });

  it("falls back to default break seconds when none is supplied", () => {
    const r = rhythmFromFocusSec(30 * 60);
    expect(r.id).toBe("custom");
    expect(r.focusSec).toBe(30 * 60);
    expect(r.breakSec).toBeGreaterThan(0);
  });

  it("tolerates small rounding drift when matching a preset", () => {
    expect(rhythmFromFocusSec(ROOM_RHYTHMS.standard.focusSec + 30).id).toBe("standard");
  });
});
