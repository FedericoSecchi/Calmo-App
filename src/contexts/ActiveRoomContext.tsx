// Keeps a single "active room" across the whole /app shell. Persists to
// localStorage so tab close, reload or PWA relaunch all land back in the
// same room. When a room is active, the room's shared timer takes over the
// Dashboard timer card, the center FAB, the tab title and the PiP window —
// so the user only ever sees one running timer.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchRoomMeta,
  useFocusRoom,
  type RoomInfo,
  type RoomPresence,
  type RoomPhase,
  type RoomRhythmId,
  type RoomTimerState,
} from "@/hooks/useFocusRoom";
import {
  clearActiveRoom,
  readActiveRoom,
  readNickname,
  recordVisit,
  writeActiveRoom,
  writeNickname,
  type ActiveRoomRecord,
} from "@/lib/activeRoomStorage";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/i18n";
import { setPersonalTimerSuppressed } from "@/lib/timerSuppress";
import { formatTimerTitle } from "@/lib/timer";
import { useFocusTimer } from "@/contexts/FocusTimerContext";

type FocusRoomReturn = ReturnType<typeof useFocusRoom>;

export interface ActiveRoomContextValue {
  activeRoom: ActiveRoomRecord | null;
  info: RoomInfo | null;
  presence: RoomPresence[];
  state: RoomTimerState | null;
  remainingSec: number;
  myKey: string;
  rhythmId: RoomRhythmId | null;
  phase: RoomPhase | null;
  isRunning: boolean;
  nickname: string;
  openActiveRoom: () => void;
  setActiveRoom: (record: {
    code: string;
    name?: string | null;
    nickname?: string;
    isOwner?: boolean;
  }) => void;
  leaveActiveRoom: () => void;
  setNickname: (value: string) => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  setRhythm: (rhythm: RoomRhythmId) => void;
  logActivity: (kind: "exercise" | "water") => Promise<void>;
  rename: (name: string | null) => Promise<boolean>;
  reconnectCount: number;
}

const ActiveRoomContext = createContext<ActiveRoomContextValue | null>(null);

export function useActiveRoom(): ActiveRoomContextValue {
  const ctx = useContext(ActiveRoomContext);
  if (!ctx) throw new Error("useActiveRoom must be used within ActiveRoomProvider");
  return ctx;
}

interface ProviderProps {
  children: ReactNode;
}

export function ActiveRoomProvider({ children }: ProviderProps) {
  const [activeRoom, setActiveRoomState] = useState<ActiveRoomRecord | null>(() => readActiveRoom());
  const [nickname, setNicknameState] = useState<string>(() => readNickname());
  const [reconnectCount, setReconnectCount] = useState(0);
  const { toast } = useToast();
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { pauseTimer, isRunning: personalIsRunning, closePipWindow } = useFocusTimer();

  // On mount with a stored active room: verify it still exists. If not, clear
  // the slot and tell the user. This runs once per session (rooms don't
  // vanish mid-session).
  const verifiedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeRoom) return;
    if (verifiedRef.current === activeRoom.code) return;
    verifiedRef.current = activeRoom.code;
    let cancelled = false;
    (async () => {
      // Best-effort optimistic refresh of name + ownership. A null response
      // only means "we couldn't verify now" — the live hook will still fire
      // not_found on its own if the room is really gone, which is where we
      // actually clear the slot.
      const meta = await fetchRoomMeta(activeRoom.code);
      if (cancelled || !meta) return;
      setActiveRoomState((prev) =>
        prev && prev.code === meta.code
          ? { ...prev, isOwner: meta.isOwner, name: meta.name ?? prev.name ?? null }
          : prev,
      );
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally depend only on the code so we don't thrash on name updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.code]);

  // Live realtime hook — always called (rules of hooks). When there's no
  // active room, we pass undefined and useFocusRoom becomes an idle no-op.
  const liveName = (activeRoom?.nickname?.trim() || nickname.trim() || t.app.room.nameFallback).trim();
  const liveRaw: FocusRoomReturn = useFocusRoom(activeRoom?.code, liveName);
  const live: FocusRoomReturn | null = activeRoom ? liveRaw : null;

  // When live.info comes in with a server-side name, mirror it into the
  // stored active-room record so the strip and Mis salas stay fresh.
  useEffect(() => {
    if (!activeRoom || !live?.info) return;
    const info = live.info;
    const nextName = info.name ?? activeRoom.name ?? null;
    const nextOwner = info.isOwner;
    if (nextName !== activeRoom.name || nextOwner !== !!activeRoom.isOwner) {
      const updated: ActiveRoomRecord = {
        ...activeRoom,
        name: nextName,
        isOwner: nextOwner,
      };
      writeActiveRoom(updated);
      setActiveRoomState(updated);
      recordVisit({
        code: updated.code,
        name: updated.name ?? null,
        gardenTheme: info.gardenTheme,
        isOwner: info.isOwner,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.info?.name, live?.info?.isOwner]);

  const setActiveRoom = useCallback<ActiveRoomContextValue["setActiveRoom"]>((record) => {
    const existing = readActiveRoom();
    const nick = record.nickname?.trim() || existing?.nickname || readNickname() || "";
    const next: ActiveRoomRecord = {
      code: record.code,
      name: record.name ?? existing?.name ?? null,
      nickname: nick,
      visitedAt: Date.now(),
      isOwner: record.isOwner ?? existing?.isOwner ?? false,
    };
    writeActiveRoom(next);
    if (nick) writeNickname(nick);
    setActiveRoomState(next);
    verifiedRef.current = null; // trigger re-verify on next effect run
    recordVisit({ code: next.code, name: next.name, gardenTheme: null, isOwner: !!next.isOwner });
    setReconnectCount((n) => n + 1);
  }, []);

  const leaveActiveRoom = useCallback(() => {
    clearActiveRoom();
    setActiveRoomState(null);
    verifiedRef.current = null;
  }, []);

  const openActiveRoom = useCallback(() => {
    if (!activeRoom) return;
    navigate(`/app/room/${activeRoom.code}`);
  }, [activeRoom, navigate]);

  const setNickname = useCallback((value: string) => {
    const trimmed = value.trim();
    writeNickname(trimmed);
    setNicknameState(trimmed);
  }, []);

  // Memoized passthroughs. Null-safe when there's no active room so consumers
  // can call them unconditionally.
  const pause = useCallback(() => live?.pause(), [live]);
  const resume = useCallback(() => live?.resume(), [live]);
  const skip = useCallback(() => live?.skip(), [live]);
  const setRhythm = useCallback(
    (rhythm: RoomRhythmId) => live?.setRhythm(rhythm),
    [live],
  );
  const logActivity = useCallback(
    async (kind: "exercise" | "water") => {
      if (!live) return;
      await live.logActivity(kind);
    },
    [live],
  );
  const rename = useCallback(
    async (name: string | null) => {
      if (!live) return false;
      const ok = await live.rename(name);
      if (ok) {
        const trimmed = name?.trim() ?? null;
        if (activeRoom) {
          const updated: ActiveRoomRecord = { ...activeRoom, name: trimmed };
          writeActiveRoom(updated);
          setActiveRoomState(updated);
          recordVisit({
            code: updated.code,
            name: updated.name,
            gardenTheme: live.info?.gardenTheme ?? null,
            isOwner: !!updated.isOwner,
          });
        }
      }
      return ok;
    },
    [live, activeRoom],
  );

  // When landing on /app/room/:code: the Room page is responsible for
  // calling setActiveRoom. If the user navigates away but doesn't press
  // "Salir", we keep the room active.
  useEffect(() => {
    // Guard: if the live hook reports not_found or disconnected explicitly,
    // clear the slot so Mis salas doesn't keep offering a dead room.
    if (!activeRoom || !live) return;
    if (live.status === "not_found") {
      clearActiveRoom();
      setActiveRoomState(null);
      toast({ title: t.app.room.activeExpired });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.status, activeRoom?.code]);

  // While a room is active:
  //   * suppress the personal timer's title + PiP side-effects,
  //   * pause the personal timer (returns paused when the user leaves),
  //   * drive document.title from the room timer.
  useEffect(() => {
    const roomTakeover = !!activeRoom;
    setPersonalTimerSuppressed(roomTakeover);
    if (roomTakeover) {
      if (personalIsRunning) pauseTimer();
      closePipWindow();
    }
    return () => {
      setPersonalTimerSuppressed(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.code]);

  // Document title mirror the room's timer. Writes default title when the
  // room is paused so the tab doesn't lie.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const defaultTitle = `${t.meta.siteName} — ${t.meta.tagline}`;
    if (!activeRoom || !live?.state) {
      return;
    }
    if (!live.state.isRunning) {
      document.title = defaultTitle;
      return;
    }
    const phaseLabel =
      live.state.phase === "focus" ? t.app.timer.titles.focus : t.app.timer.titles.rest;
    document.title = formatTimerTitle({
      remainingSeconds: live.remainingSec,
      phaseLabel,
      siteName: t.meta.siteName,
    });
    return () => {
      document.title = defaultTitle;
    };
  }, [activeRoom, live?.state?.isRunning, live?.state?.phase, live?.remainingSec, t]);

  const value = useMemo<ActiveRoomContextValue>(() => {
    return {
      activeRoom,
      info: live?.info ?? null,
      presence: live?.presence ?? [],
      state: live?.state ?? null,
      remainingSec: live?.remainingSec ?? 0,
      myKey: live?.myKey ?? "",
      rhythmId: live?.state?.rhythmId ?? null,
      phase: live?.state?.phase ?? null,
      isRunning: live?.state?.isRunning ?? false,
      nickname,
      openActiveRoom,
      setActiveRoom,
      leaveActiveRoom,
      setNickname,
      pause,
      resume,
      skip,
      setRhythm,
      logActivity,
      rename,
      reconnectCount,
    };
    // We depend on the live hook's primitive outputs (presence array identity
    // is stable per sync, info identity on each refresh).
  }, [
    activeRoom,
    live?.info,
    live?.presence,
    live?.state,
    live?.remainingSec,
    live?.myKey,
    nickname,
    openActiveRoom,
    setActiveRoom,
    leaveActiveRoom,
    setNickname,
    pause,
    resume,
    skip,
    setRhythm,
    logActivity,
    rename,
    reconnectCount,
  ]);
  // react/no-unused-vars happy
  void location;

  return <ActiveRoomContext.Provider value={value}>{children}</ActiveRoomContext.Provider>;
}
