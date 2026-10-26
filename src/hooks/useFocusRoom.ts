import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export const ROOM_FOCUS_SEC = 25 * 60;
export const ROOM_BREAK_SEC = 5 * 60;

export const ROOM_MIN_FOCUS_MIN = 5;
export const ROOM_MAX_FOCUS_MIN = 120;
export const ROOM_MIN_BREAK_MIN = 1;
export const ROOM_MAX_BREAK_MIN = 30;

export type RoomPhase = "focus" | "break";

export type RoomPresetId = "light" | "standard" | "focus";
export type RoomRhythmId = RoomPresetId | "custom";

export interface RoomRhythm {
  id: RoomRhythmId;
  focusSec: number;
  breakSec: number;
}

export const ROOM_RHYTHMS: Record<RoomPresetId, RoomRhythm> = {
  light: { id: "light", focusSec: 25 * 60, breakSec: 5 * 60 },
  standard: { id: "standard", focusSec: 45 * 60, breakSec: 5 * 60 },
  focus: { id: "focus", focusSec: 90 * 60, breakSec: 10 * 60 },
};

// Infer the rhythm from a focus-phase duration. Pre-existing rooms (e.g. a
// room created when "light" was 60 min) stay at their stored duration but
// surface as the "custom" rhythm so the UI doesn't mis-label them.
export function rhythmFromFocusSec(focusSec: number, breakSec?: number): RoomRhythm {
  for (const r of Object.values(ROOM_RHYTHMS)) {
    if (Math.abs(r.focusSec - focusSec) < 60) return r;
  }
  return {
    id: "custom",
    focusSec: focusSec > 0 ? focusSec : ROOM_FOCUS_SEC,
    breakSec: typeof breakSec === "number" && breakSec > 0 ? breakSec : ROOM_BREAK_SEC,
  };
}

export interface RoomTimerState {
  phase: RoomPhase;
  isRunning: boolean;
  phaseStartAt: number; // ms epoch; while running, phase elapsed = now - phaseStartAt
  durationSec: number;
  pausedRemainingSec: number; // meaningful only when !isRunning
  updatedAt: number;
  rhythmId: RoomRhythmId;
  focusSec: number;
  breakSec: number;
}

export interface RoomInfo {
  code: string;
  gardenTheme: "zen" | "sky" | "companion";
  createdAt: string;
  focusCount: number;
  breakCount: number;
  exerciseCount: number;
  waterCount: number;
  name: string | null;
  isOwner: boolean;
}

export interface RoomMeta {
  code: string;
  name: string | null;
  isOwner: boolean;
  lastActiveAt: string;
}

export interface MyRoom {
  code: string;
  name: string | null;
  gardenTheme: "zen" | "sky" | "companion";
  createdAt: string;
  lastActiveAt: string;
}

export interface RoomPresence {
  key: string;
  name: string;
  joinedAt: number;
}

export type RoomStatus = "loading" | "ready" | "not_found" | "realtime_error" | "deleted";

export async function fetchRoomMeta(code: string): Promise<RoomMeta | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc("get_focus_room_meta", { p_code: code });
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    code: row.code,
    name: row.name ?? null,
    isOwner: !!row.is_owner,
    lastActiveAt: row.last_active_at,
  };
}

export async function listMyRooms(): Promise<MyRoom[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("list_my_rooms");
  if (error || !Array.isArray(data)) return [];
  return data.map((row) => ({
    code: row.code,
    name: row.name ?? null,
    gardenTheme: row.garden_theme,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
  }));
}

export async function renameRoom(code: string, name: string | null): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const payload = { p_code: code, p_name: name };
  const { error } = await supabase.rpc("rename_focus_room", payload);
  return !error;
}

export async function deleteFocusRoom(code: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.rpc("delete_focus_room", { p_code: code });
  return !error;
}

export async function createRoomWithName(theme: "zen" | "sky" | "companion", name: string | null): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc("create_focus_room", { p_theme: theme });
  if (error || typeof data !== "string") return null;
  const code = data;
  if (name && name.trim()) {
    await renameRoom(code, name.trim());
  }
  return code;
}

interface Broadcast {
  state: { payload: RoomTimerState };
  request_state: { payload: { fromKey: string } };
  activity: { payload: { kind: "exercise" | "water"; byKey: string } };
  room_deleted: { payload: { byKey: string } };
}

const initialState = (rhythm: RoomRhythm): RoomTimerState => ({
  phase: "focus",
  isRunning: false,
  phaseStartAt: Date.now(),
  durationSec: rhythm.focusSec,
  pausedRemainingSec: rhythm.focusSec,
  updatedAt: 0,
  rhythmId: rhythm.id,
  focusSec: rhythm.focusSec,
  breakSec: rhythm.breakSec,
});

const computeRemainingSec = (state: RoomTimerState): number => {
  if (!state.isRunning) return Math.max(0, state.pausedRemainingSec);
  const elapsed = Math.floor((Date.now() - state.phaseStartAt) / 1000);
  return Math.max(0, state.durationSec - elapsed);
};

export function useFocusRoom(
  code: string | undefined,
  name: string,
  options?: { initialRhythmId?: RoomRhythmId },
) {
  const [status, setStatus] = useState<RoomStatus>("loading");
  const [info, setInfo] = useState<RoomInfo | null>(null);
  const [presence, setPresence] = useState<RoomPresence[]>([]);
  const initialRhythmKey: RoomPresetId =
    options?.initialRhythmId && options.initialRhythmId !== "custom"
      ? options.initialRhythmId
      : "standard";
  const initialRhythm = ROOM_RHYTHMS[initialRhythmKey];
  const [state, setState] = useState<RoomTimerState>(() => initialState(initialRhythm));
  const [remainingSec, setRemainingSec] = useState<number>(initialRhythm.focusSec);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const stateRef = useRef<RoomTimerState>(state);
  stateRef.current = state;
  const myKeyRef = useRef<string>("");
  if (!myKeyRef.current) {
    myKeyRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  const presenceRef = useRef<RoomPresence[]>([]);
  presenceRef.current = presence;

  const broadcastState = useCallback((next: RoomTimerState) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({
      type: "broadcast",
      event: "state",
      payload: next,
    }).catch(() => {});
  }, []);

  const applyLocal = useCallback(
    (updater: (prev: RoomTimerState) => RoomTimerState, broadcast: boolean) => {
      setState((prev) => {
        const next = updater(prev);
        if (broadcast) broadcastState(next);
        return next;
      });
    },
    [broadcastState],
  );

  const pause = useCallback(() => {
    applyLocal((prev) => {
      if (!prev.isRunning) return prev;
      const remaining = computeRemainingSec(prev);
      return {
        ...prev,
        isRunning: false,
        pausedRemainingSec: remaining,
        updatedAt: Date.now(),
      };
    }, true);
  }, [applyLocal]);

  const resume = useCallback(() => {
    applyLocal((prev) => {
      if (prev.isRunning) return prev;
      const now = Date.now();
      const consumed = prev.durationSec - prev.pausedRemainingSec;
      return {
        ...prev,
        isRunning: true,
        phaseStartAt: now - consumed * 1000,
        updatedAt: now,
      };
    }, true);
  }, [applyLocal]);

  const skip = useCallback(() => {
    applyLocal((prev) => {
      const nextPhase: RoomPhase = prev.phase === "focus" ? "break" : "focus";
      const nextDuration = nextPhase === "focus" ? prev.focusSec : prev.breakSec;
      const now = Date.now();
      return {
        ...prev,
        phase: nextPhase,
        isRunning: true,
        phaseStartAt: now,
        durationSec: nextDuration,
        pausedRemainingSec: nextDuration,
        updatedAt: now,
      };
    }, true);
  }, [applyLocal]);

  // Reset the current phase for everyone: keep phase and running state,
  // snap time back to the phase's full duration.
  const resetPhase = useCallback(() => {
    applyLocal((prev) => {
      const duration = prev.phase === "focus" ? prev.focusSec : prev.breakSec;
      const now = Date.now();
      return {
        ...prev,
        phaseStartAt: now,
        durationSec: duration,
        pausedRemainingSec: duration,
        updatedAt: now,
      };
    }, true);
  }, [applyLocal]);

  const setRhythm = useCallback(
    (rhythmId: RoomPresetId) => {
      applyLocal((prev) => {
        if (prev.isRunning) return prev;
        const r = ROOM_RHYTHMS[rhythmId];
        return {
          ...prev,
          rhythmId: r.id,
          focusSec: r.focusSec,
          breakSec: r.breakSec,
          phase: "focus",
          durationSec: r.focusSec,
          pausedRemainingSec: r.focusSec,
          updatedAt: Date.now(),
        };
      }, true);
    },
    [applyLocal],
  );

  const setCustomRhythm = useCallback(
    (workMinutes: number, restMinutes: number) => {
      const workSec = Math.max(ROOM_MIN_FOCUS_MIN, Math.min(ROOM_MAX_FOCUS_MIN, Math.round(workMinutes))) * 60;
      const restSec = Math.max(ROOM_MIN_BREAK_MIN, Math.min(ROOM_MAX_BREAK_MIN, Math.round(restMinutes))) * 60;
      applyLocal((prev) => {
        if (prev.isRunning) return prev;
        // Snap to a preset if the user happens to type exactly one; that way
        // the rhythm name stays accurate.
        const match = Object.values(ROOM_RHYTHMS).find(
          (p) => p.focusSec === workSec && p.breakSec === restSec,
        );
        const nextId: RoomRhythmId = match ? match.id : "custom";
        return {
          ...prev,
          rhythmId: nextId,
          focusSec: workSec,
          breakSec: restSec,
          phase: "focus",
          durationSec: workSec,
          pausedRemainingSec: workSec,
          updatedAt: Date.now(),
        };
      }, true);
    },
    [applyLocal],
  );

  const logActivity = useCallback(
    async (kind: "exercise" | "water") => {
      if (!code || !isSupabaseConfigured) return;
      try {
        await supabase.rpc("log_room_event", { p_code: code, p_kind: kind });
      } catch {
        /* best-effort */
      }
      const ch = channelRef.current;
      try {
        await ch?.send({
          type: "broadcast",
          event: "activity",
          payload: { kind, byKey: myKeyRef.current },
        });
      } catch {
        /* best-effort */
      }
      void refreshCountsRef.current();
    },
    [code],
  );

  const refreshCountsRef = useRef<() => Promise<void>>(async () => {});
  const refreshCounts = useCallback(async () => {
    if (!code || !isSupabaseConfigured) return;
    const { data, error } = await supabase.rpc("get_focus_room", { p_code: code });
    if (error || !data) return;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return;
    const meta = await fetchRoomMeta(code);
    setInfo({
      code: row.code,
      gardenTheme: row.garden_theme,
      createdAt: row.created_at,
      focusCount: row.focus_count ?? 0,
      breakCount: row.break_count ?? 0,
      exerciseCount: row.exercise_count ?? 0,
      waterCount: row.water_count ?? 0,
      name: meta?.name ?? null,
      isOwner: meta?.isOwner ?? false,
    });
  }, [code]);
  useEffect(() => {
    refreshCountsRef.current = refreshCounts;
  }, [refreshCounts]);

  // Load room info first.
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured) {
        setStatus("not_found");
        return;
      }
      const { data, error } = await supabase.rpc("get_focus_room", { p_code: code });
      if (cancelled) return;
      if (error) {
        setStatus("not_found");
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setStatus("not_found");
        return;
      }
      const meta = await fetchRoomMeta(code);
      if (cancelled) return;
      setInfo({
        code: row.code,
        gardenTheme: row.garden_theme,
        createdAt: row.created_at,
        focusCount: row.focus_count ?? 0,
        breakCount: row.break_count ?? 0,
        exerciseCount: row.exercise_count ?? 0,
        waterCount: row.water_count ?? 0,
        name: meta?.name ?? null,
        isOwner: meta?.isOwner ?? false,
      });
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Realtime: presence + broadcast. We intentionally depend only on `code`
  // and `status`; the name is read via ref so a cosmetic rename doesn't
  // tear the channel down.
  const nameRef = useRef(name);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);

  useEffect(() => {
    if (!code || status !== "ready" || !isSupabaseConfigured) return;
    const channelName = `room:${code}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: myKeyRef.current }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    const trimmedName = (nameRef.current || "").trim() || "Guest";
    const joinedAt = Date.now();

    channel
      .on("presence", { event: "sync" }, () => {
        const stateMap = channel.presenceState<{ name: string; joinedAt: number }>();
        const flat: RoomPresence[] = [];
        for (const [key, metas] of Object.entries(stateMap)) {
          const first = metas[0];
          if (first) flat.push({ key, name: first.name ?? "Guest", joinedAt: first.joinedAt ?? Date.now() });
        }
        flat.sort((a, b) => (a.joinedAt === b.joinedAt ? a.key.localeCompare(b.key) : a.joinedAt - b.joinedAt));
        setPresence(flat);
      })
      .on("broadcast", { event: "state" }, ({ payload }: Broadcast["state"]) => {
        if (!payload || typeof payload.updatedAt !== "number") return;
        if (payload.updatedAt < stateRef.current.updatedAt) return;
        // Backfill rhythm fields for any legacy payload that lacks them.
        const r = rhythmFromFocusSec(
          payload.focusSec ?? payload.durationSec ?? ROOM_FOCUS_SEC,
          payload.breakSec,
        );
        setState({
          ...payload,
          rhythmId: payload.rhythmId ?? r.id,
          focusSec: payload.focusSec ?? r.focusSec,
          breakSec: payload.breakSec ?? r.breakSec,
        });
      })
      .on("broadcast", { event: "request_state" }, ({ payload }: Broadcast["request_state"]) => {
        if (!payload?.fromKey || payload.fromKey === myKeyRef.current) return;
        // Always answer so joiners pick up the creator's rhythm. If we haven't
        // mutated state yet (updatedAt=0) we still want the newcomer to adopt
        // our rhythm, so we send the current state as-is.
        channel.send({ type: "broadcast", event: "state", payload: stateRef.current }).catch(() => {});
      })
      .on("broadcast", { event: "activity" }, () => {
        void refreshCounts();
      })
      .on("broadcast", { event: "room_deleted" }, () => {
        setStatus("deleted");
      });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel
          .track({ name: trimmedName, joinedAt })
          .catch(() => {});
        channel.send({
          type: "broadcast",
          event: "request_state",
          payload: { fromKey: myKeyRef.current },
        }).catch(() => {});
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setStatus("realtime_error");
      }
    });

    return () => {
      try {
        channel.unsubscribe();
      } catch {
        /* ignore */
      }
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, status]);

  // Tick: 1 Hz, derive remainingSec from state.
  useEffect(() => {
    const tick = () => setRemainingSec(computeRemainingSec(stateRef.current));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Low-frequency counter poll so the shared garden stays accurate even if a
  // broadcast is dropped (e.g. transient network blip).
  useEffect(() => {
    if (!code || status !== "ready") return;
    const id = window.setInterval(() => {
      void refreshCountsRef.current();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [code, status]);

  // Phase transition: when remainingSec hits 0 while running, the lowest-key
  // client advances the state and logs the completed phase.
  const transitionLockRef = useRef<string | null>(null);
  useEffect(() => {
    if (remainingSec > 0) return;
    if (!stateRef.current.isRunning) return;
    const sorted = [...presenceRef.current].sort((a, b) => a.key.localeCompare(b.key));
    const leader = sorted[0]?.key;
    const transitionKey = `${stateRef.current.phaseStartAt}:${stateRef.current.phase}`;
    if (transitionLockRef.current === transitionKey) return;
    transitionLockRef.current = transitionKey;

    const endedPhase = stateRef.current.phase;
    const nextPhase: RoomPhase = endedPhase === "focus" ? "break" : "focus";
    const nextDuration = nextPhase === "focus" ? stateRef.current.focusSec : stateRef.current.breakSec;
    const now = Date.now();
    const nextState: RoomTimerState = {
      ...stateRef.current,
      phase: nextPhase,
      isRunning: true,
      phaseStartAt: now,
      durationSec: nextDuration,
      pausedRemainingSec: nextDuration,
      updatedAt: now,
    };
    setState(nextState);
    if (leader === myKeyRef.current) {
      broadcastState(nextState);
      if (isSupabaseConfigured && code) {
        (async () => {
          try {
            await supabase.rpc("log_room_event", { p_code: code, p_kind: endedPhase });
          } catch {
            /* best-effort */
          }
          void refreshCountsRef.current();
        })();
      }
    }
  }, [remainingSec, broadcastState, code]);

  const rename = useCallback(
    async (name: string | null): Promise<boolean> => {
      if (!code) return false;
      const ok = await renameRoom(code, name);
      if (ok) {
        setInfo((prev) => (prev ? { ...prev, name } : prev));
      }
      return ok;
    },
    [code],
  );

  // Owner-only. Broadcasts first so everyone else sees the room is gone
  // instantly, then invokes the RPC. The RPC's cascade removes the server
  // state; subsequent get_focus_room_meta calls return nothing.
  const deleteRoom = useCallback(async (): Promise<boolean> => {
    if (!code) return false;
    const ch = channelRef.current;
    if (ch) {
      try {
        await ch.send({
          type: "broadcast",
          event: "room_deleted",
          payload: { byKey: myKeyRef.current },
        });
      } catch {
        /* best-effort */
      }
    }
    return deleteFocusRoom(code);
  }, [code]);

  return {
    status,
    info,
    presence,
    state,
    remainingSec,
    myKey: myKeyRef.current,
    pause,
    resume,
    skip,
    resetPhase,
    setRhythm,
    setCustomRhythm,
    logActivity,
    refreshCounts,
    rename,
    deleteRoom,
  };
}
