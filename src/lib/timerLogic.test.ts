import { describe, it, expect } from "vitest";
import { shouldFirePreEndWarning, formatTimerTitle } from "./timer";

describe("shouldFirePreEndWarning", () => {
  const base = {
    initialPhaseSeconds: 45 * 60,
    warnBeforeSec: 120,
    alreadyFired: false,
  };

  it("fires when crossing the threshold on this tick", () => {
    expect(
      shouldFirePreEndWarning({
        ...base,
        previousRemainingSeconds: 121,
        remainingSeconds: 120,
      }),
    ).toBe(true);
  });

  it("fires when the tick jumps a few seconds past the threshold", () => {
    expect(
      shouldFirePreEndWarning({
        ...base,
        previousRemainingSeconds: 122,
        remainingSeconds: 118,
      }),
    ).toBe(true);
  });

  it("does not fire before the threshold", () => {
    expect(
      shouldFirePreEndWarning({
        ...base,
        previousRemainingSeconds: 200,
        remainingSeconds: 190,
      }),
    ).toBe(false);
  });

  it("does not fire a second time after already firing", () => {
    expect(
      shouldFirePreEndWarning({
        ...base,
        alreadyFired: true,
        previousRemainingSeconds: 115,
        remainingSeconds: 110,
      }),
    ).toBe(false);
  });

  it("does not fire for phases shorter than the warning window", () => {
    expect(
      shouldFirePreEndWarning({
        ...base,
        initialPhaseSeconds: 60,
        previousRemainingSeconds: 121,
        remainingSeconds: 59,
      }),
    ).toBe(false);
  });

  it("does not fire for phases equal to the warning window", () => {
    expect(
      shouldFirePreEndWarning({
        ...base,
        initialPhaseSeconds: 120,
        previousRemainingSeconds: 121,
        remainingSeconds: 119,
      }),
    ).toBe(false);
  });

  it("is a no-op when the warning is disabled", () => {
    expect(
      shouldFirePreEndWarning({
        ...base,
        warnBeforeSec: 0,
        previousRemainingSeconds: 121,
        remainingSeconds: 120,
      }),
    ).toBe(false);
  });

  it("respects a 1-minute warning for mid-length phases", () => {
    expect(
      shouldFirePreEndWarning({
        initialPhaseSeconds: 10 * 60,
        warnBeforeSec: 60,
        alreadyFired: false,
        previousRemainingSeconds: 61,
        remainingSeconds: 60,
      }),
    ).toBe(true);
  });
});

describe("formatTimerTitle", () => {
  it("formats a mid-phase timer", () => {
    expect(
      formatTimerTitle({
        remainingSeconds: 12 * 60 + 34,
        phaseLabel: "Focus",
        siteName: "Calmo",
      }),
    ).toBe("12:34 · Focus — Calmo");
  });

  it("pads single-digit minutes and seconds", () => {
    expect(
      formatTimerTitle({
        remainingSeconds: 3 * 60 + 5,
        phaseLabel: "Break",
        siteName: "Calmo",
      }),
    ).toBe("03:05 · Break — Calmo");
  });

  it("expands past an hour", () => {
    expect(
      formatTimerTitle({
        remainingSeconds: 3 * 3600 + 7 * 60 + 2,
        phaseLabel: "Focus",
        siteName: "Calmo",
      }),
    ).toBe("3:07:02 · Focus — Calmo");
  });

  it("clamps negatives to zero", () => {
    expect(
      formatTimerTitle({
        remainingSeconds: -10,
        phaseLabel: "Focus",
        siteName: "Calmo",
      }),
    ).toBe("00:00 · Focus — Calmo");
  });
});
