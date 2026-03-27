import { describe, it, expect } from "vitest";
import { breathingPatterns } from "@/components/BreathingGuide";

describe("breathingPatterns", () => {
  it("defines the three expected patterns", () => {
    const ids = breathingPatterns.map((p) => p.id);
    expect(ids).toContain("478");
    expect(ids).toContain("box");
    expect(ids).toContain("deep");
  });

  it("4-7-8 pattern has correct phase durations", () => {
    const pattern = breathingPatterns.find((p) => p.id === "478")!;
    expect(pattern.inhaleSeconds).toBe(4);
    expect(pattern.holdInSeconds).toBe(7);
    expect(pattern.exhaleSeconds).toBe(8);
    expect(pattern.holdOutSeconds).toBe(0);
  });

  it("box breathing has equal phase durations", () => {
    const pattern = breathingPatterns.find((p) => p.id === "box")!;
    expect(pattern.inhaleSeconds).toBe(4);
    expect(pattern.holdInSeconds).toBe(4);
    expect(pattern.exhaleSeconds).toBe(4);
    expect(pattern.holdOutSeconds).toBe(4);
  });

  it("all patterns have valid total cycle counts", () => {
    for (const pattern of breathingPatterns) {
      expect(pattern.totalCycles).toBeGreaterThan(0);
      expect(pattern.totalCycles).toBeLessThanOrEqual(10);
    }
  });

  it("all patterns have names and descriptions", () => {
    for (const pattern of breathingPatterns) {
      expect(pattern.name).toBeTruthy();
      expect(pattern.description).toBeTruthy();
    }
  });

  it("all patterns have positive inhale and exhale durations", () => {
    for (const pattern of breathingPatterns) {
      expect(pattern.inhaleSeconds).toBeGreaterThan(0);
      expect(pattern.exhaleSeconds).toBeGreaterThan(0);
    }
  });
});

describe("breathing total duration calculation", () => {
  it("4-7-8 pattern lasts approximately 2 minutes for 4 cycles", () => {
    const pattern = breathingPatterns.find((p) => p.id === "478")!;
    const cycleSeconds =
      pattern.inhaleSeconds +
      pattern.holdInSeconds +
      pattern.exhaleSeconds +
      pattern.holdOutSeconds;
    const totalSeconds = cycleSeconds * pattern.totalCycles;
    // 4+7+8 = 19 seconds per cycle, 4 cycles = 76 seconds ≈ 1.27 min
    expect(totalSeconds).toBe(76);
  });

  it("box breathing lasts 64 seconds for 4 cycles", () => {
    const pattern = breathingPatterns.find((p) => p.id === "box")!;
    const cycleSeconds =
      pattern.inhaleSeconds +
      pattern.holdInSeconds +
      pattern.exhaleSeconds +
      pattern.holdOutSeconds;
    const totalSeconds = cycleSeconds * pattern.totalCycles;
    // 4+4+4+4 = 16 seconds per cycle, 4 cycles = 64 seconds
    expect(totalSeconds).toBe(64);
  });
});
