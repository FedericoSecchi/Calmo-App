import { useState } from "react";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const submit = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError(t.pricing.pro.invalid);
      setStatus("error");
      return;
    }
    setError(null);
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
