import { useCallback, useEffect, useState } from "react";

const VOLUME_KEY = "calmo_timer_volume";
const WARN_BEFORE_KEY = "calmo_timer_warn_before_sec";

const DEFAULT_VOLUME = 80;
const DEFAULT_WARN_BEFORE_SEC = 120;

export const WARN_BEFORE_OPTIONS = [0, 60, 120, 300] as const;
export type WarnBeforeSec = (typeof WARN_BEFORE_OPTIONS)[number];

function readNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* ignore */
  }
}

function normalizeVolume(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_VOLUME;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function normalizeWarnBefore(n: number): WarnBeforeSec {
  const found = WARN_BEFORE_OPTIONS.find((o) => o === n);
  return (found ?? DEFAULT_WARN_BEFORE_SEC) as WarnBeforeSec;
}

export function useTimerPrefs() {
  const [volume, setVolumeState] = useState<number>(() =>
    normalizeVolume(readNumber(VOLUME_KEY, DEFAULT_VOLUME))
  );
  const [warnBeforeSec, setWarnBeforeSecState] = useState<WarnBeforeSec>(() =>
    normalizeWarnBefore(readNumber(WARN_BEFORE_KEY, DEFAULT_WARN_BEFORE_SEC))
  );

  useEffect(() => {
    writeNumber(VOLUME_KEY, volume);
  }, [volume]);

  useEffect(() => {
    writeNumber(WARN_BEFORE_KEY, warnBeforeSec);
  }, [warnBeforeSec]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(normalizeVolume(v));
  }, []);

  const setWarnBeforeSec = useCallback((v: number) => {
    setWarnBeforeSecState(normalizeWarnBefore(v));
  }, []);

  return { volume, setVolume, warnBeforeSec, setWarnBeforeSec };
}

export function readTimerVolume(): number {
  return normalizeVolume(readNumber(VOLUME_KEY, DEFAULT_VOLUME));
}

export function readWarnBeforeSec(): WarnBeforeSec {
  return normalizeWarnBefore(readNumber(WARN_BEFORE_KEY, DEFAULT_WARN_BEFORE_SEC));
}
