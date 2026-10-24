import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { en } from "./en";
import { es } from "./es";
import { DEFAULT_LANG, LANGS, type Lang } from "./types";

export * from "./types";
export { en, es };

export const DICTS: Record<Lang, typeof en> = { en, es };

export const LANG_STORAGE_KEY = "calmo_lang";

export function detectLangFromPath(pathname: string): Lang {
  return pathname.startsWith("/es/") || pathname === "/es" ? "es" : "en";
}

export function detectLangFromBrowser(): Lang {
  if (typeof navigator === "undefined") return DEFAULT_LANG;
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("es") ? "es" : "en";
}

export function readStoredLang(): Lang | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return stored === "es" || stored === "en" ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredLang(lang: Lang) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

export function getPublicLang(pathname: string): Lang {
  return detectLangFromPath(pathname);
}

export function getAppLang(): Lang {
  return readStoredLang() ?? detectLangFromBrowser();
}

export function useLang(): Lang {
  const location = useLocation();
  const isAppPath = location.pathname.startsWith("/app") || location.pathname.startsWith("/onboarding") || location.pathname.startsWith("/auth");
  const lang: Lang = isAppPath ? getAppLang() : getPublicLang(location.pathname);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);
  return lang;
}

export function useT() {
  const lang = useLang();
  return { t: DICTS[lang], lang };
}

export { LANGS, DEFAULT_LANG };
export type { Lang };
