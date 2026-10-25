import { useCallback, useEffect, useState } from "react";

const VOLUME_KEY = "calmo_timer_volume";
const WARN_BEFORE_KEY = "calmo_timer_warn_before_sec";
const AUTO_PIP_KEY = "calmo_timer_auto_pip";
const VISUAL_ALERT_KEY = "calmo_timer_visual_alert";

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

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1" || raw === "true";
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
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
  const [autoPip, setAutoPipState] = useState<boolean>(() =>
    readBool(AUTO_PIP_KEY, true),
  );
  const [visualAlert, setVisualAlertState] = useState<boolean>(() =>
    readBool(VISUAL_ALERT_KEY, true),
  );

  useEffect(() => {
    writeNumber(VOLUME_KEY, volume);
  }, [volume]);

  useEffect(() => {
    writeNumber(WARN_BEFORE_KEY, warnBeforeSec);
  }, [warnBeforeSec]);

  useEffect(() => {
    writeBool(AUTO_PIP_KEY, autoPip);
  }, [autoPip]);

  useEffect(() => {
    writeBool(VISUAL_ALERT_KEY, visualAlert);
  }, [visualAlert]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(normalizeVolume(v));
  }, []);

  const setWarnBeforeSec = useCallback((v: number) => {
    setWarnBeforeSecState(normalizeWarnBefore(v));
  }, []);

  const setAutoPip = useCallback((v: boolean) => {
    setAutoPipState(Boolean(v));
  }, []);

  const setVisualAlert = useCallback((v: boolean) => {
    setVisualAlertState(Boolean(v));
  }, []);

  return {
    volume,
    setVolume,
    warnBeforeSec,
    setWarnBeforeSec,
    autoPip,
    setAutoPip,
    visualAlert,
    setVisualAlert,
  };
}

export function readTimerVolume(): number {
  return normalizeVolume(readNumber(VOLUME_KEY, DEFAULT_VOLUME));
}

export function readWarnBeforeSec(): WarnBeforeSec {
  return normalizeWarnBefore(readNumber(WARN_BEFORE_KEY, DEFAULT_WARN_BEFORE_SEC));
}
