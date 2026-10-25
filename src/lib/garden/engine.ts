// Pure, deterministic garden engine. Given the same inputs it always draws
// the same scene — same stones, same stars, same companion pose. The themes
// derive their layout from a seeded PRNG so each user/room gets a stable but
// unique garden.

export type GardenTheme = "zen" | "sky" | "companion";

export interface GardenCounts {
  focus: number;
  break: number;
  exercise: number;
  water: number;
}

export interface SceneInput {
  theme: GardenTheme;
  counts: GardenCounts;
  seed: string;
  size: number;
  weekly?: boolean;
}

export interface Stone {
  cx: number;
  cy: number;
  r: number;
  rotation: number;
}

export interface Furrow {
  path: string;
}

export interface MossDot {
  cx: number;
  cy: number;
  r: number;
}

export interface ZenScene {
  stones: Stone[];
  furrows: Furrow[];
  mossDots: MossDot[];
  rakeRings: Array<{ cx: number; cy: number; r: number }>;
}

export interface Star {
  cx: number;
  cy: number;
  r: number;
  bright: boolean;
}

export interface Constellation {
  points: Array<{ x: number; y: number }>;
}

export interface SkyScene {
  stars: Star[];
  tintStrength: number;
  constellation: Constellation | null;
}

export interface CompanionScene {
  // 0 = tense/at desk, 1..4 = progressively more relaxed (break-driven).
  relaxLevel: number;
  // 0 = none, 1..5 plant growth stages (water-driven).
  plantLevel: number;
  // Stretch arm length (exercise-driven), 0..1.
  stretchAmount: number;
}

export interface Scene {
  theme: GardenTheme;
  size: number;
  zen?: ZenScene;
  sky?: SkyScene;
  companion?: CompanionScene;
  altText: string;
}

// --- Deterministic PRNG ---

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRng(seed: string, salt: string): () => number {
  const h = xmur3(seed + "|" + salt)();
  return mulberry32(h);
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// --- Alt text ---

function describeCounts(counts: GardenCounts, theme: GardenTheme): string {
  const items: string[] = [];
  if (counts.break > 0) items.push(`${counts.break} breaks`);
  if (counts.exercise > 0) items.push(`${counts.exercise} exercises`);
  if (counts.water > 0) items.push(`${counts.water} glasses of water`);
  if (counts.focus > 0) items.push(`${counts.focus} focus completed`);
  const summary = items.length === 0 ? "nothing logged yet" : items.join(", ");
  return `Your ${theme} garden today: ${summary}.`;
}

// --- Zen ---

function buildZen(counts: GardenCounts, seed: string, size: number): ZenScene {
  const rng = seededRng(seed, "zen");
  const pad = size * 0.08;
  const inner = size - pad * 2;

  const stones: Stone[] = [];
  const stoneCount = clamp(counts.exercise, 0, 10);
  for (let i = 0; i < stoneCount; i++) {
    stones.push({
      cx: pad + rng() * inner,
      cy: pad + rng() * inner,
      r: size * (0.04 + rng() * 0.03),
      rotation: rng() * 360,
    });
  }

  const furrows: Furrow[] = [];
  const furrowCount = clamp(counts.break, 0, 20);
  for (let i = 0; i < furrowCount; i++) {
    const y = pad + ((i + 0.5) / Math.max(furrowCount, 1)) * inner;
    const amp = size * (0.012 + rng() * 0.015);
    const points: string[] = [];
    const steps = 10;
    for (let s = 0; s <= steps; s++) {
      const x = pad + (s / steps) * inner;
      const yy = y + Math.sin(s * 1.1 + rng() * 2) * amp;
      points.push(`${s === 0 ? "M" : "L"} ${x.toFixed(2)} ${yy.toFixed(2)}`);
    }
    furrows.push({ path: points.join(" ") });
  }

  const mossDots: MossDot[] = [];
  const mossCount = clamp(counts.water * 4, 0, 48);
  for (let i = 0; i < mossCount; i++) {
    mossDots.push({
      cx: pad + rng() * inner,
      cy: pad + rng() * inner,
      r: size * 0.005 + rng() * size * 0.004,
    });
  }

  const rakeRings: Array<{ cx: number; cy: number; r: number }> = [];
  const ringsPerStone = clamp(counts.focus, 0, stones.length);
  for (let i = 0; i < ringsPerStone; i++) {
    const stone = stones[i];
    if (!stone) break;
    rakeRings.push({ cx: stone.cx, cy: stone.cy, r: stone.r * (1.9 + rng() * 0.6) });
  }

  return { stones, furrows, mossDots, rakeRings };
}

// --- Sky ---

function buildSky(counts: GardenCounts, seed: string, size: number, weekly: boolean): SkyScene {
  const rng = seededRng(seed, "sky");
  const pad = size * 0.05;
  const inner = size - pad * 2;

  const stars: Star[] = [];
  const dimCount = clamp(counts.break * 3, 0, 60);
  for (let i = 0; i < dimCount; i++) {
    stars.push({
      cx: pad + rng() * inner,
      cy: pad + rng() * inner,
      r: size * (0.004 + rng() * 0.006),
      bright: false,
    });
  }
  const brightCount = clamp(counts.exercise, 0, 10);
  for (let i = 0; i < brightCount; i++) {
    stars.push({
      cx: pad + rng() * inner,
      cy: pad + rng() * inner,
      r: size * (0.015 + rng() * 0.01),
      bright: true,
    });
  }

  const tintStrength = clamp(counts.water / 10, 0, 1);

  let constellation: Constellation | null = null;
  if (weekly && counts.focus >= 3 && stars.length >= 4) {
    const bright = stars.filter((s) => s.bright).slice(0, 7);
    const picks = bright.length >= 3 ? bright : stars.slice(0, Math.min(5, stars.length));
    constellation = {
      points: picks.map((s) => ({ x: s.cx, y: s.cy })),
    };
  }

  return { stars, tintStrength, constellation };
}

// --- Companion ---

function buildCompanion(counts: GardenCounts): CompanionScene {
  const relaxLevel = clamp(Math.floor((counts.break + Math.floor(counts.exercise / 2)) / 1), 0, 4);
  const plantLevel = clamp(counts.water, 0, 5);
  const stretchAmount = clamp(counts.exercise / 6, 0, 1);
  return { relaxLevel, plantLevel, stretchAmount };
}

export function renderScene(input: SceneInput): Scene {
  const { theme, counts, seed, size, weekly = false } = input;
  const altText = describeCounts(counts, theme);
  if (theme === "zen") {
    return { theme, size, zen: buildZen(counts, seed, size), altText };
  }
  if (theme === "sky") {
    return { theme, size, sky: buildSky(counts, seed, size, weekly), altText };
  }
  return { theme, size, companion: buildCompanion(counts), altText };
}
