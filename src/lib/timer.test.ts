import { describe, it, expect } from "vitest";
import { presets, type PresetId } from "@/contexts/FocusTimerContext";

describe("presets", () => {
  it("defines the three expected presets", () => {
    const ids = presets.map((p) => p.id);
    expect(ids).toContain("light");
    expect(ids).toContain("standard");
    expect(ids).toContain("focus");
  });

  it("light preset has correct timings", () => {
    const light = presets.find((p) => p.id === "light")!;
    expect(light.workMinutes).toBe(60);
    expect(light.restMinutes).toBe(10);
  });

  it("standard preset has correct timings", () => {
    const standard = presets.find((p) => p.id === "standard")!;
    expect(standard.workMinutes).toBe(45);
    expect(standard.restMinutes).toBe(5);
  });

  it("focus preset has correct timings", () => {
    const focus = presets.find((p) => p.id === "focus")!;
    expect(focus.workMinutes).toBe(90);
    expect(focus.restMinutes).toBe(10);
  });

  it("all presets have names and descriptions", () => {
    for (const preset of presets) {
      expect(preset.name).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(preset.interval).toBeTruthy();
    }
  });
});

describe("formatTime helper", () => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  it("formats zero as 00:00", () => {
    expect(formatTime(0)).toBe("00:00");
  });

  it("formats 60 seconds as 01:00", () => {
    expect(formatTime(60)).toBe("01:00");
  });

  it("formats 90 minutes as 90:00", () => {
    expect(formatTime(90 * 60)).toBe("90:00");
  });

  it("formats 45 minutes and 30 seconds correctly", () => {
    expect(formatTime(45 * 60 + 30)).toBe("45:30");
  });

  it("pads seconds below 10", () => {
    expect(formatTime(65)).toBe("01:05");
  });
});

describe("ScreenBreakState logic", () => {
  const SCREEN_BREAK_INTERVAL = 1200; // 20 minutes in seconds

  it("should trigger after 20 minutes of work", () => {
    const workElapsed = 1200;
    const lastTriggerWorkElapsed = 0;
    const shouldTrigger =
      workElapsed >= SCREEN_BREAK_INTERVAL &&
      Math.floor(workElapsed / SCREEN_BREAK_INTERVAL) >
        Math.floor(lastTriggerWorkElapsed / SCREEN_BREAK_INTERVAL);
    expect(shouldTrigger).toBe(true);
  });

  it("should not trigger before 20 minutes", () => {
    const workElapsed = 1199;
    const lastTriggerWorkElapsed = 0;
    const shouldTrigger =
      workElapsed >= SCREEN_BREAK_INTERVAL &&
      Math.floor(workElapsed / SCREEN_BREAK_INTERVAL) >
        Math.floor(lastTriggerWorkElapsed / SCREEN_BREAK_INTERVAL);
    expect(shouldTrigger).toBe(false);
  });

  it("should not trigger again immediately after triggering", () => {
    const workElapsed = 1205;
    const lastTriggerWorkElapsed = 1200;
    const shouldTrigger =
      workElapsed >= SCREEN_BREAK_INTERVAL &&
      Math.floor(workElapsed / SCREEN_BREAK_INTERVAL) >
        Math.floor(lastTriggerWorkElapsed / SCREEN_BREAK_INTERVAL);
    expect(shouldTrigger).toBe(false);
  });

  it("should trigger again after second 20-minute interval", () => {
    const workElapsed = 2400;
    const lastTriggerWorkElapsed = 1200;
    const shouldTrigger =
      workElapsed >= SCREEN_BREAK_INTERVAL &&
      Math.floor(workElapsed / SCREEN_BREAK_INTERVAL) >
        Math.floor(lastTriggerWorkElapsed / SCREEN_BREAK_INTERVAL);
    expect(shouldTrigger).toBe(true);
  });
});
