import { SITE_URL } from "@/config/site";
import { getAppLang, getPublicLang } from "@/lib/i18n";

const EVENT_NAMES = [
  "page_view",
  "start_guest",
  "sign_up",
  "login",
  "onboarding_complete",
  "focus_started",
  "break_completed",
  "exercise_completed",
  "pain_logged",
  "water_logged",
  "pricing_view",
  "waitlist_join",
  "pwa_installed",
  "language_changed",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let sessionId: string | null = null;
function getSessionId(): string {
  if (sessionId) return sessionId;
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`.padEnd(36, "0");
  sessionId = uuid;
  return uuid;
}

function externalReferrerHost(): string | null {
  if (typeof document === "undefined") return null;
  const ref = document.referrer;
  if (!ref) return null;
  try {
    const url = new URL(ref);
    if (url.hostname === window.location.hostname) return null;
    return url.hostname.slice(0, 100);
  } catch {
    return null;
  }
}

function isAutomated(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof window === "undefined") return false;
  if ((window as unknown as { __CALMO_PRERENDER__?: boolean }).__CALMO_PRERENDER__) return true;
  if (navigator.webdriver) return true;
  const ua = navigator.userAgent || "";
  if (/HeadlessChrome|Playwright|puppeteer|Chrome-Lighthouse/i.test(ua)) return true;
  return false;
}

export function track(name: EventName, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (isAutomated()) return;
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  if (!EVENT_NAMES.includes(name)) return;

  const path = (window.location.pathname + window.location.search).slice(0, 200) || "/";
  const lang = window.location.pathname.startsWith("/app") ? getAppLang() : getPublicLang(window.location.pathname);
  const body = {
    name,
    path,
    lang,
    session_id: getSessionId(),
    referrer_host: externalReferrerHost(),
    props,
  };

  try {
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    } as const;
    const url = `${SUPABASE_URL}/rest/v1/events`;
    void fetch(url, {
      method: "POST",
      body: blob,
      headers,
      keepalive: true,
      credentials: "omit",
      mode: "cors",
    }).catch(() => {
      /* silent */
    });
  } catch {
    /* silent */
  }
  void SITE_URL;
}

export function trackPageView() {
  track("page_view");
}
