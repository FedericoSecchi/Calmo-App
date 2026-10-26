import { useActiveRoom } from "@/contexts/ActiveRoomContext";
import { useFocusTimer } from "@/contexts/FocusTimerContext";

export interface AppTimerShape {
  source: "room" | "personal";
  remainingSec: number;
  isRunning: boolean;
  phaseLabel: "work" | "rest";
  toggle: () => void;
  skip: () => void;
  resetPhase: () => void;
  formatTime: (sec: number) => string;
}

// Returns the "currently in control" timer: the active room's shared timer
// when one exists, otherwise the user's personal pomodoro. Every surface that
// shows a running timer (center FAB, tab title, PiP window) uses this.
export function useAppTimer(): AppTimerShape {
  const personal = useFocusTimer();
  const room = useActiveRoom();

  if (room.activeRoom && room.state) {
    return {
      source: "room",
      remainingSec: room.remainingSec,
      isRunning: room.isRunning,
      phaseLabel: room.phase === "focus" ? "work" : "rest",
      toggle: () => (room.isRunning ? room.pause() : room.resume()),
      skip: () => room.skip(),
      resetPhase: () => room.resetPhase(),
      formatTime: personal.formatTime,
    };
  }

  return {
    source: "personal",
    remainingSec: personal.timeRemaining,
    isRunning: personal.isRunning,
    phaseLabel: personal.currentPhase,
    toggle: personal.toggleTimer,
    skip: personal.skipToNextPhase,
    resetPhase: personal.resetPhase,
    formatTime: personal.formatTime,
  };
}
