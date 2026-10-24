import { useCallback, useEffect, useState } from "react";

export interface PainRecord {
  id: string;
  area: string;
  intensity: number;
  notes: string | null;
  created_at: string;
}

export interface CreatePainRecord {
  area: string;
  intensity: number;
  notes?: string;
}

const STORAGE_KEY = "calmo_pain_log";

function read(): PainRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PainRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(records: PainRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-500)));
  } catch {
    /* ignore */
  }
}

export const usePainRecords = (days: number = 30) => {
  const [records, setRecords] = useState<PainRecord[]>(() => read());

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRecords(read());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const filtered = (() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return records
      .filter((r) => new Date(r.created_at).getTime() >= cutoff.getTime())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  })();

  const createRecord = useCallback((input: CreatePainRecord) => {
    const next: PainRecord = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      area: input.area,
      intensity: input.intensity,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
    };
    setRecords((prev) => {
      const updated = [...prev, next];
      write(updated);
      return updated;
    });
  }, []);

  return {
    records: filtered,
    isLoading: false,
    error: null as unknown,
    createRecord,
    isCreating: false,
    createError: null as unknown,
  };
};
