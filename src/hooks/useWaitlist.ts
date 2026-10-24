import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      if (!isSupabaseConfigured) {
        setStatus("success");
        return;
      }
      const { error: insertError } = await supabase
        .from("waitlist")
        .insert({ email: trimmed, lang, source });
      if (insertError && insertError.code !== "23505") {
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
