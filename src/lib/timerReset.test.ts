import { describe, it, expect } from "vitest";

// Pure helper mirroring the behavior of resetPhase in FocusTimerContext +
// useFocusRoom: full duration is restored while phase and running state are
// preserved.
interface PhaseLike {
  phase: "work" | "rest";
  workMinutes: number;
  restMinutes: number;
  customRestMinutes?: number | null;
  remainingSeconds: number;
  isRunning: boolean;
}

function resetPhase(input: PhaseLike): PhaseLike {
  const totalSeconds =
    input.phase === "work"
      ? input.workMinutes * 60
      : (input.customRestMinutes ?? input.restMinutes) * 60;
  return {
    ...input,
    remainingSeconds: totalSeconds,
  };
}

describe("resetPhase (shared logic)", () => {
  it("restores full WORK duration without flipping phase", () => {
    const next = resetPhase({
      phase: "work",
      workMinutes: 45,
      restMinutes: 5,
      remainingSeconds: 120,
      isRunning: true,
    });
    expect(next.phase).toBe("work");
    expect(next.remainingSeconds).toBe(45 * 60);
    expect(next.isRunning).toBe(true);
  });

  it("restores full REST duration without flipping phase", () => {
    const next = resetPhase({
      phase: "rest",
      workMinutes: 25,
      restMinutes: 5,
      remainingSeconds: 10,
      isRunning: false,
    });
    expect(next.phase).toBe("rest");
    expect(next.remainingSeconds).toBe(5 * 60);
    expect(next.isRunning).toBe(false);
  });

  it("uses custom rest minutes when set", () => {
    const next = resetPhase({
      phase: "rest",
      workMinutes: 25,
      restMinutes: 5,
      customRestMinutes: 7,
      remainingSeconds: 60,
      isRunning: true,
    });
    expect(next.remainingSeconds).toBe(7 * 60);
    expect(next.phase).toBe("rest");
  });

  it("is a no-op on phase/running state regardless of starting remaining", () => {
    const base = {
      phase: "work" as const,
      workMinutes: 25,
      restMinutes: 5,
      remainingSeconds: 0,
      isRunning: false,
    };
    const next = resetPhase(base);
    expect(next.phase).toBe(base.phase);
    expect(next.isRunning).toBe(base.isRunning);
    expect(next.remainingSeconds).toBe(25 * 60);
  });
});
