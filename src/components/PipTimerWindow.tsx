import { createPortal } from "react-dom";
import { Pause, Play, SkipForward, X } from "lucide-react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { useT } from "@/lib/i18n";

export const PipTimerWindow = () => {
  const {
    pipOpen,
    pipRoot,
    currentPhase,
    timeRemaining,
    isRunning,
    toggleTimer,
    skipToNextPhase,
    closePipWindow,
    formatTime,
  } = useFocusTimer();
  const { t } = useT();

  if (!pipOpen || !pipRoot) return null;

  const phaseLabel =
    currentPhase === "work" ? t.app.timer.pip.focusLabel : t.app.timer.pip.restLabel;
  const phaseAccent = currentPhase === "work" ? "bg-primary" : "bg-secondary";

  return createPortal(
    <div
      className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-background p-4 text-foreground"
      style={{ fontFamily: "inherit" }}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${phaseAccent}`} aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {phaseLabel}
        </span>
      </div>
      <div
        className="font-heading text-5xl tabular-nums text-foreground"
        aria-live="polite"
      >
        {formatTime(timeRemaining)}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTimer}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          aria-label={isRunning ? t.app.timer.pip.pause : t.app.timer.pip.start}
        >
          {isRunning ? (
            <Pause className="h-4 w-4" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={skipToNextPhase}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium"
          aria-label={t.app.timer.pip.skip}
        >
          <SkipForward className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={closePipWindow}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium"
          aria-label={t.app.timer.pip.close}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>,
    pipRoot,
  );
};
