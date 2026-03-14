/**
 * PWA install and standalone detection.
 * - Captures beforeinstallprompt for deferred install
 * - Detects standalone (installed) mode
 * - Tracks last visit and consecutive visit count for return reminders
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_LAST_VISIT = "calmo_pwa_last_visit";
const STORAGE_VISIT_DAYS = "calmo_pwa_visit_days";
const STORAGE_INSTALL_DISMISSED = "calmo_pwa_install_dismissed";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function getTodayKey(): string {
  return new Date().toDateString();
}

function getLastVisitTimestamp(): number {
  try {
    const s = localStorage.getItem(STORAGE_LAST_VISIT);
    return s ? parseInt(s, 10) : 0;
  } catch {
    return 0;
  }
}

function getConsecutiveVisitDays(): number {
  try {
    const raw = localStorage.getItem(STORAGE_VISIT_DAYS);
    if (!raw) return 1;
    const { lastKey, count } = JSON.parse(raw);
    const today = getTodayKey();
    if (lastKey === today) return count;
    const last = new Date(lastKey).getTime();
    const now = new Date(today).getTime();
    if (now - last > MS_PER_DAY + 60000) return 1; // new day after gap
    return count + 1;
  } catch {
    return 1;
  }
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [lastVisitTs, setLastVisitTs] = useState<number>(0);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Standalone: installed PWA or display-mode standalone
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsStandalone(standalone);
  }, []);

  // beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Load persisted install-dismissed
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_INSTALL_DISMISSED);
      setInstallDismissed(v === "1");
    } catch {
      setInstallDismissed(false);
    }
  }, []);

  // Update last visit and consecutive days on mount
  useEffect(() => {
    const now = Date.now();
    const last = getLastVisitTimestamp();
    setLastVisitTs(last);

    localStorage.setItem(STORAGE_LAST_VISIT, String(now));
    const today = getTodayKey();
    let count = 1;
    try {
      const raw = localStorage.getItem(STORAGE_VISIT_DAYS);
      let lastKey = today;
      if (raw) {
        const prev = JSON.parse(raw);
        lastKey = prev.lastKey;
        count = prev.count;
        if (lastKey !== today) {
          const prevDate = new Date(lastKey).getTime();
          count = now - prevDate > MS_PER_DAY + 60000 ? 1 : count + 1;
          lastKey = today;
        }
      }
      localStorage.setItem(STORAGE_VISIT_DAYS, JSON.stringify({ lastKey, count }));
      setConsecutiveDays(count);
    } catch {
      localStorage.setItem(STORAGE_VISIT_DAYS, JSON.stringify({ lastKey: today, count: 1 }));
      setConsecutiveDays(1);
    }
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!installPrompt) return "unavailable";
    try {
      await (installPrompt as BeforeInstallPromptEvent).prompt();
      const { outcome } = await (installPrompt as BeforeInstallPromptEvent).userChoice;
      if (outcome === "accepted") setInstallPrompt(null);
      return outcome;
    } catch {
      return "unavailable";
    }
  }, [installPrompt]);

  const dismissInstallPrompt = useCallback(() => {
    setInstallDismissed(true);
    try {
      localStorage.setItem(STORAGE_INSTALL_DISMISSED, "1");
    } catch {}
  }, []);

  const markUserInteracted = useCallback(() => {
    setHasUserInteracted(true);
  }, []);

  const canShowInstallBanner =
    !isStandalone &&
    !!installPrompt &&
    !installDismissed &&
    hasUserInteracted &&
    consecutiveDays >= 2;

  const daysSinceLastVisit = lastVisitTs
    ? Math.floor((Date.now() - lastVisitTs) / MS_PER_DAY)
    : 0;

  return {
    installPrompt,
    promptInstall,
    dismissInstallPrompt,
    isStandalone,
    lastVisitTs,
    consecutiveDays,
    daysSinceLastVisit,
    installDismissed,
    hasUserInteracted,
    markUserInteracted,
    canShowInstallBanner,
  };
}
