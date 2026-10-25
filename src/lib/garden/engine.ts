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
  /** 0=deep night (lots of activity), 1=sunset (empty state). */
  sunsetness: number;
}

export interface CompanionScene {
  // 0 = tense/at desk, 1..4 = progressively more relaxed (break-driven).
  relaxLevel: number;
  // 0..5 plant growth stages (water-driven). 1 is a visible sapling (baseline).
  plantLevel: number;
  // Stretch arm length (exercise-driven), 0..1.
  stretchAmount: number;
  // When true the scene uses a larger-pot/plant layout (weekly view).
  weeklyBoost: boolean;
}

export interface Scene {
  theme: GardenTheme;
  size: number;
  zen?: ZenScene;
  sky?: SkyScene;
  companion?: CompanionScene;
  altText: string;
  /** True when the counts have no activity to render (special baseline scene). */
  isEmpty: boolean;
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

export function hasAnyActivity(counts: GardenCounts): boolean {
  return counts.break > 0 || counts.exercise > 0 || counts.water > 0 || counts.focus > 0;
}

// --- Zen ---
//
// A zen garden reads as sand with parallel rake lines, stones with concentric
// rings carved into the sand around them, and a bit of moss hugging the base
// of each stone. Breaks add rake rows; exercises add stones; focus completed
// cycles deepen the rings; water drops add moss.

function hashString(s: string): number {
  return xmur3(s)();
}

function buildZen(counts: GardenCounts, seed: string, size: number): ZenScene {
  const rng = seededRng(seed, "zen");
  const pad = size * 0.08;
  const inner = size - pad * 2;
  const isEmpty = !hasAnyActivity(counts);

  // Empty state: a single hero stone centered, with its surrounding ring
  // and a few base rake lines. This signals "zen garden, awaiting your first
  // pause".
  const heroStone: Stone | null = isEmpty
    ? {
        cx: pad + inner * 0.5,
        cy: pad + inner * 0.55,
        r: size * 0.075,
        rotation: 12,
      }
    : null;

  // Stones from exercise completions. The hero stone (if present) is kept.
  const stones: Stone[] = [];
  if (heroStone) stones.push(heroStone);
  const stoneCount = clamp(counts.exercise, 0, 8);
  for (let i = 0; i < stoneCount; i++) {
    // Avoid stacking stones: distribute roughly across a jittered grid.
    const col = i % 3;
    const row = Math.floor(i / 3);
    const gx = pad + inner * (0.2 + col * 0.3) + (rng() - 0.5) * inner * 0.08;
    const gy = pad + inner * (0.25 + row * 0.25) + (rng() - 0.5) * inner * 0.08;
    stones.push({
      cx: gx,
      cy: gy,
      r: size * (0.04 + rng() * 0.025),
      rotation: rng() * 360,
    });
  }

  // Straight parallel rake lines. The sand always has at least a few base
  // rows so it reads as "freshly raked"; each break adds another row on top,
  // capped at a tidy maximum so the garden never looks overcrowded.
  const furrowRows = clamp(4 + counts.break, 4, 12);
  const furrows: Furrow[] = [];
  for (let i = 0; i < furrowRows; i++) {
    const y = pad + ((i + 0.5) / Math.max(furrowRows, 1)) * inner;
    // Straight horizontal line that dodges around stones (small bend when it
    // passes near one, kept small so the overall look stays parallel).
    const steps = 24;
    const points: string[] = [];
    for (let s = 0; s <= steps; s++) {
      const x = pad + (s / steps) * inner;
      let yy = y;
      for (const stone of stones) {
        const dx = x - stone.cx;
        const dy = y - stone.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = stone.r * 2.6;
        if (dist < influence) {
          const bend = (influence - dist) * 0.5;
          yy += dy >= 0 ? bend : -bend;
        }
      }
      points.push(`${s === 0 ? "M" : "L"} ${x.toFixed(2)} ${yy.toFixed(2)}`);
    }
    furrows.push({ path: points.join(" ") });
  }

  // Moss hugs the base of each stone — a small cluster beside each one. Each
  // drink of water adds one more fleck in the cluster, up to a cap.
  const mossDots: MossDot[] = [];
  const mossPerStone = clamp(counts.water, 0, 6);
  stones.forEach((stone, idx) => {
    const base = Math.max(2, mossPerStone);
    for (let i = 0; i < base; i++) {
      const angle = (hashString(seed + idx + i) % 360) * (Math.PI / 180) + 0.7 * Math.PI;
      const radial = stone.r * (0.9 + ((hashString(seed + idx + i + "r") % 100) / 100) * 0.4);
      mossDots.push({
        cx: stone.cx + Math.cos(angle) * radial,
        cy: stone.cy + Math.sin(angle) * radial * 0.6,
        r: size * (0.006 + ((hashString(seed + idx + i + "s") % 100) / 100) * 0.003),
      });
    }
  });

  // Concentric rings around stones: 1 base ring per stone (empty state hero
  // included) plus one extra ring per focus completed, up to a cap per stone.
  const rakeRings: Array<{ cx: number; cy: number; r: number }> = [];
  const extraRings = clamp(counts.focus, 0, 3);
  stones.forEach((stone) => {
    const total = 1 + extraRings;
    for (let r = 1; r <= total; r++) {
      rakeRings.push({ cx: stone.cx, cy: stone.cy, r: stone.r * (1.6 + r * 0.55) });
    }
  });

  return { stones, furrows, mossDots, rakeRings };
}

// --- Sky ---

function buildSky(counts: GardenCounts, seed: string, size: number, weekly: boolean): SkyScene {
  const rng = seededRng(seed, "sky");
  const pad = size * 0.05;
  const inner = size - pad * 2;
  const isEmpty = !hasAnyActivity(counts);

  const stars: Star[] = [];
  // Empty-state scene: a sunset sky with a single faint "first star" waiting
  // to be lit. Any activity dims the sunset and adds real stars.
  if (isEmpty) {
    stars.push({
      cx: pad + inner * 0.72,
      cy: pad + inner * 0.3,
      r: size * 0.014,
      bright: true,
    });
  }

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
  // Sunset fades as activity accumulates. 1 (full sunset) when empty; drops
  // quickly with any activity.
  const activityTotal = counts.break + counts.exercise + counts.water + counts.focus;
  const sunsetness = isEmpty ? 1 : clamp(1 - activityTotal / 4, 0, 0.4);

  let constellation: Constellation | null = null;
  if (weekly && counts.focus >= 3 && stars.length >= 4) {
    const bright = stars.filter((s) => s.bright).slice(0, 7);
    const picks = bright.length >= 3 ? bright : stars.slice(0, Math.min(5, stars.length));
    constellation = {
      points: picks.map((s) => ({ x: s.cx, y: s.cy })),
    };
  }

  return { stars, tintStrength, constellation, sunsetness };
}

// --- Companion ---

function buildCompanion(counts: GardenCounts, weekly: boolean): CompanionScene {
  const relaxLevel = clamp(Math.floor((counts.break + Math.floor(counts.exercise / 2)) / 1), 0, 4);
  // Baseline (empty state): plant visible as a sapling so the scene reads as
  // "someone sitting at their desk with a plant" from day zero.
  const plantLevel = clamp(1 + counts.water, 1, 5);
  const stretchAmount = clamp(counts.exercise / 6, 0, 1);
  return { relaxLevel, plantLevel, stretchAmount, weeklyBoost: weekly };
}

export function renderScene(input: SceneInput): Scene {
  const { theme, counts, seed, size, weekly = false } = input;
  const isEmpty = !hasAnyActivity(counts);
  // Alt text is overridden by the component (which has i18n context). The
  // engine returns the English fallback so the renderScene() return remains
  // self-describing when used from tests or non-React code.
  const altText = isEmpty
    ? `Your ${theme} garden today: nothing logged yet.`
    : `Your ${theme} garden today.`;
  if (theme === "zen") {
    return { theme, size, zen: buildZen(counts, seed, size), altText, isEmpty };
  }
  if (theme === "sky") {
    return { theme, size, sky: buildSky(counts, seed, size, weekly), altText, isEmpty };
  }
  return { theme, size, companion: buildCompanion(counts, weekly), altText, isEmpty };
}
