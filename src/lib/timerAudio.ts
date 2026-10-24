// Timer audio: generated with Web Audio so there's nothing to license.
// `volume` is a 0..1 scalar coming from the user slider (0..100 / 100).

type AudioCtor = typeof AudioContext;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    (window.AudioContext as AudioCtor | undefined) ??
    ((window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext);
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

function clampVolume(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  return v;
}

interface Partial {
  freq: number;
  gain: number; // relative
  type?: OscillatorType;
}

function playTone(
  ctx: AudioContext,
  partials: Partial[],
  duration: number,
  peakGain: number,
  attack = 0.01,
) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.connect(ctx.destination);
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(peakGain, now + attack);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  for (const p of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = p.type ?? "sine";
    osc.frequency.value = p.freq;
    g.gain.value = p.gain;
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }
}

// Loud, pleasant "work finished → break" chord: C5 + E5 + G5 with a quick
// grace note. ~1.5s so it's hard to miss even from a few metres away.
export function playFocusEndSound(volume: number) {
  const v = clampVolume(volume);
  if (v === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    playTone(
      ctx,
      [
        { freq: 523.25, gain: 0.9 }, // C5
        { freq: 659.25, gain: 0.7 }, // E5
        { freq: 783.99, gain: 0.5 }, // G5
      ],
      1.5,
      0.9 * v,
    );
    // grace note a beat earlier
    const second = ctx.createOscillator();
    const sg = ctx.createGain();
    second.type = "sine";
    second.frequency.value = 1046.5; // C6
    const now = ctx.currentTime;
    sg.gain.setValueAtTime(0, now);
    sg.gain.linearRampToValueAtTime(0.4 * v, now + 0.6);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    second.connect(sg);
    sg.connect(ctx.destination);
    second.start(now + 0.5);
    second.stop(now + 1.2);
  } catch {
    /* ignore */
  }
}

// Softer "break → work" chime: A4 + C#5 for ~1.2s.
export function playBreakEndSound(volume: number) {
  const v = clampVolume(volume);
  if (v === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    playTone(
      ctx,
      [
        { freq: 440, gain: 0.9 }, // A4
        { freq: 554.37, gain: 0.6 }, // C#5
      ],
      1.2,
      0.8 * v,
    );
  } catch {
    /* ignore */
  }
}

// Short, distinct cue a few minutes before the end of a phase.
export function playPreEndSound(volume: number) {
  const v = clampVolume(volume);
  if (v === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    playTone(
      ctx,
      [{ freq: 659.25, gain: 1.0 }], // E5
      0.45,
      0.5 * v,
    );
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 783.99; // G5
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.35 * v, now + 0.22);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now + 0.18);
    osc.stop(now + 0.7);
  } catch {
    /* ignore */
  }
}

// Final-countdown blip (1..10 sec remaining). Subtle, pitched higher as it
// gets more urgent.
export function playCountdownBlip(volume: number, seconds: number) {
  const v = clampVolume(volume);
  if (v === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    playTone(
      ctx,
      [{ freq: seconds <= 3 ? 1000 : 600, gain: 1.0 }],
      0.2,
      0.3 * v,
    );
  } catch {
    /* ignore */
  }
}
