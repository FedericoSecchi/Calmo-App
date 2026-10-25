import { describe, it, expect } from "vitest";
import { renderScene, type GardenCounts } from "./engine";

const COUNTS: GardenCounts = { focus: 2, break: 4, exercise: 3, water: 5 };

describe("garden engine determinism", () => {
  it("renders the same zen scene for the same seed and counts", () => {
    const a = renderScene({ theme: "zen", counts: COUNTS, seed: "user-1", size: 300 });
    const b = renderScene({ theme: "zen", counts: COUNTS, seed: "user-1", size: 300 });
    expect(a.zen).toEqual(b.zen);
  });

  it("different seeds produce different zen layouts", () => {
    const a = renderScene({ theme: "zen", counts: COUNTS, seed: "user-1", size: 300 });
    const b = renderScene({ theme: "zen", counts: COUNTS, seed: "user-2", size: 300 });
    expect(a.zen).not.toEqual(b.zen);
  });

  it("more water → more moss dots", () => {
    const low = renderScene({ theme: "zen", counts: { ...COUNTS, water: 1 }, seed: "s", size: 300 });
    const high = renderScene({ theme: "zen", counts: { ...COUNTS, water: 8 }, seed: "s", size: 300 });
    expect((high.zen?.mossDots.length ?? 0)).toBeGreaterThan(low.zen?.mossDots.length ?? 0);
  });

  it("completed focus adds extra rake rings around stones", () => {
    const no = renderScene({ theme: "zen", counts: { ...COUNTS, focus: 0 }, seed: "s", size: 300 });
    const some = renderScene({ theme: "zen", counts: COUNTS, seed: "s", size: 300 });
    expect(some.zen!.rakeRings.length).toBeGreaterThan(no.zen!.rakeRings.length);
  });

  it("sky weekly=true with enough focus unlocks a constellation", () => {
    const weekCounts = { ...COUNTS, focus: 5 };
    const daily = renderScene({ theme: "sky", counts: weekCounts, seed: "s", size: 300 });
    const weekly = renderScene({ theme: "sky", counts: weekCounts, seed: "s", size: 300, weekly: true });
    expect(daily.sky?.constellation).toBeNull();
    expect(weekly.sky?.constellation?.points.length ?? 0).toBeGreaterThan(2);
  });

  it("companion plant grows with water", () => {
    const dry = renderScene({ theme: "companion", counts: { ...COUNTS, water: 0 }, seed: "s", size: 300 });
    const watered = renderScene({ theme: "companion", counts: { ...COUNTS, water: 4 }, seed: "s", size: 300 });
    // Baseline plant is a sapling (>=1) so it's always visible; watering grows it.
    expect(watered.companion!.plantLevel).toBeGreaterThan(dry.companion!.plantLevel);
    expect(dry.companion!.plantLevel).toBeGreaterThanOrEqual(1);
  });

  it("companion relaxes with more breaks", () => {
    const tense = renderScene({ theme: "companion", counts: { ...COUNTS, break: 0, exercise: 0 }, seed: "s", size: 300 });
    const chill = renderScene({ theme: "companion", counts: { ...COUNTS, break: 3, exercise: 4 }, seed: "s", size: 300 });
    expect(chill.companion!.relaxLevel).toBeGreaterThan(tense.companion!.relaxLevel);
  });

  it("companion weeklyBoost is driven by the weekly flag", () => {
    const daily = renderScene({ theme: "companion", counts: COUNTS, seed: "s", size: 300 });
    const weekly = renderScene({ theme: "companion", counts: COUNTS, seed: "s", size: 300, weekly: true });
    expect(daily.companion!.weeklyBoost).toBe(false);
    expect(weekly.companion!.weeklyBoost).toBe(true);
  });

  it("isEmpty flag flips when there is any activity", () => {
    const empty = renderScene({ theme: "zen", counts: { focus: 0, break: 0, exercise: 0, water: 0 }, seed: "s", size: 300 });
    const some = renderScene({ theme: "zen", counts: { focus: 0, break: 1, exercise: 0, water: 0 }, seed: "s", size: 300 });
    expect(empty.isEmpty).toBe(true);
    expect(some.isEmpty).toBe(false);
  });

  it("empty zen garden still has one hero stone and baseline rake rows", () => {
    const empty = renderScene({ theme: "zen", counts: { focus: 0, break: 0, exercise: 0, water: 0 }, seed: "s", size: 300 });
    expect(empty.zen!.stones.length).toBeGreaterThanOrEqual(1);
    expect(empty.zen!.furrows.length).toBeGreaterThanOrEqual(3);
  });

  it("empty sky garden shows the first star and full sunsetness", () => {
    const empty = renderScene({ theme: "sky", counts: { focus: 0, break: 0, exercise: 0, water: 0 }, seed: "s", size: 300 });
    expect(empty.sky!.stars.length).toBeGreaterThanOrEqual(1);
    expect(empty.sky!.sunsetness).toBe(1);
  });

  it("alt text handles empty gardens gracefully", () => {
    const scene = renderScene({ theme: "zen", counts: { focus: 0, break: 0, exercise: 0, water: 0 }, seed: "s", size: 300 });
    expect(scene.altText).toMatch(/nothing logged yet/i);
  });
});
