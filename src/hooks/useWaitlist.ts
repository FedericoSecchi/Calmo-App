import { useState } from "react";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Submissions faster than this after the form is shown are treated as bots. */
export const WAITLIST_MIN_FILL_MS = 3000;

export interface BotSignals {
  /** Value of the hidden trap field. Real people never fill it. */
  trap: string;
  /** performance.now() when the form was shown. */
  shownAt: number;
}

export function looksLikeBot({ trap, shownAt }: BotSignals, now: number): boolean {
  return trap.trim() !== "" || now - shownAt < WAITLIST_MIN_FILL_MS;
}

// Insert via REST so the landing bundle doesn't need the supabase-js client.
// Duplicates (23505) are treated as success — the user is on the list either
// way.
async function insertWaitlist(email: string, lang: string, source: string) {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return { ok: true } as const;
  const res = await fetch(`${url}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ email, lang, source }),
  });
  if (res.ok || res.status === 201) return { ok: true } as const;
  // 23505 = unique_violation; Postgrest serializes it as a 409.
  if (res.status === 409) return { ok: true } as const;
  const text = await res.text().catch(() => "");
  return { ok: false, error: text || `HTTP ${res.status}` } as const;
}

export function useWaitlist(source: string = "pricing") {
  const { t, lang } = useT();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (email: string, signals?: BotSignals) => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError(t.pricing.pro.invalid);
      setStatus("error");
      return;
    }
    setError(null);
    // Bots get the same success message, but nothing is stored or tracked.
    if (signals && looksLikeBot(signals, performance.now())) {
      setStatus("success");
      return;
    }
    setStatus("submitting");
    try {
      const result = await insertWaitlist(trimmed, lang, source);
      if (!result.ok) {
        setError(t.auth.errors.unknown);
        setStatus("error");
        return;
      }
      track("waitlist_join", { source });
      setStatus("success");
    } catch {
      setError(t.auth.errors.unknown);
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setError(null);
  };

  return { status, error, submit, reset };
}
