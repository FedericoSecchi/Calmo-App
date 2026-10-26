// Lightweight client-side session hint for public pages (landing / SEO /
// legal). We read localStorage directly to avoid pulling AuthProvider +
// Supabase into the prerendered landing bundle. The hint is "best-effort"
// and only decides which CTA to render; nothing security-critical hangs off
// it.
import { useEffect, useState } from "react";

const GUEST_FLAG_KEY = "calmo_guest_mode";
const SUPABASE_PROJECT_REF = "wtquhlfodfqjcggaqxwk";
const SUPABASE_TOKEN_KEY = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

export function readSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(GUEST_FLAG_KEY) === "1") return true;
    const raw = window.localStorage.getItem(SUPABASE_TOKEN_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { access_token?: string; expires_at?: number } | null;
    if (!parsed?.access_token) return false;
    if (typeof parsed.expires_at === "number" && parsed.expires_at * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Hydration-safe hook: starts false (matches prerendered HTML) and flips to
// true on the client only. The swap is late enough that CLS metrics have
// already stabilized by the time the auth-aware CTAs render.
export function useSessionHint(): boolean {
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    setHasSession(readSessionHint());
  }, []);
  return hasSession;
}
