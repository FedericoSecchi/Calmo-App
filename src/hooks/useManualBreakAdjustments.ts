import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { getTodayDateString } from "@/lib/utils";

const STORAGE_KEY = "calmo_manual_break_adjustments";

function readGuest(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writeGuest(data: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export const useManualBreakAdjustments = () => {
  const { user, isGuest } = useAuth();
  const [adjustments, setAdjustments] = useState<Record<string, number>>(() => readGuest());

  useEffect(() => {
    if (!user || isGuest || !isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("manual_break_adjustments")
        .select("date,adjustment")
        .eq("user_id", user.id);
      if (!cancelled && !error && data) {
        const map: Record<string, number> = {};
        data.forEach((row: { date: string; adjustment: number }) => {
          map[row.date] = row.adjustment;
        });
        setAdjustments(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

  useEffect(() => {
    if (isGuest) {
      writeGuest(adjustments);
    }
  }, [adjustments, isGuest]);

  const getTodayAdjustment = () => {
    const today = getTodayDateString();
    return adjustments[today] || 0;
  };

  const persistToServer = async (date: string, value: number) => {
    if (!user || isGuest || !isSupabaseConfigured) return;
    await supabase
      .from("manual_break_adjustments")
      .upsert({ user_id: user.id, date, adjustment: value }, { onConflict: "user_id,date" });
  };

  const adjustToday = (delta: number) => {
    const today = getTodayDateString();
    setAdjustments((prev) => {
      const current = prev[today] || 0;
      const nextValue = current + delta;
      const next = { ...prev, [today]: nextValue };
      void persistToServer(today, nextValue);
      return next;
    });
  };

  const resetToday = () => {
    const today = getTodayDateString();
    setAdjustments((prev) => {
      const copy = { ...prev };
      delete copy[today];
      void persistToServer(today, 0);
      return copy;
    });
  };

  return {
    todayAdjustment: getTodayAdjustment(),
    adjustToday,
    resetToday,
  };
};
