import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Leaf, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { useAppTimer } from "@/hooks/useAppTimer";
import { useT } from "@/lib/i18n";

export const PipTimerWindow = () => {
  const {
    pipOpen,
    pipRoot,
    visualAlertEvent,
  } = useFocusTimer();
  const {
    phaseLabel: currentPhase,
    remainingSec: timeRemaining,
    isRunning,
    toggle: toggleTimer,
    skip: skipToNextPhase,
    resetPhase,
    formatTime,
  } = useAppTimer();
  const { t } = useT();
  const prefersReduced = useReducedMotion();
  const [resetArmed, setResetArmed] = useState(false);
  const armTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Disarm the reset confirmation when the PiP closes so it doesn't come back
  // armed next time the window opens.
  useEffect(() => {
    if (!pipOpen) {
      setResetArmed(false);
      if (armTimeoutRef.current) clearTimeout(armTimeoutRef.current);
    }
  }, [pipOpen]);

  useEffect(() => {
    return () => {
      if (armTimeoutRef.current) clearTimeout(armTimeoutRef.current);
    };
  }, []);

  if (!pipOpen || !pipRoot) return null;

  const handleReset = () => {
    if (resetArmed) {
      setResetArmed(false);
      if (armTimeoutRef.current) clearTimeout(armTimeoutRef.current);
      resetPhase();
      return;
    }
    setResetArmed(true);
    if (armTimeoutRef.current) clearTimeout(armTimeoutRef.current);
    armTimeoutRef.current = setTimeout(() => setResetArmed(false), 3000);
  };

  const phaseLabel =
    currentPhase === "work" ? t.app.timer.pip.focusLabel : t.app.timer.pip.restLabel;
  const phaseAccent = currentPhase === "work" ? "bg-primary" : "bg-secondary";
  const alertLabel = visualAlertEvent?.phase === "work"
    ? t.app.timer.visualAlert.workComplete
    : t.app.timer.visualAlert.restComplete;

  return createPortal(
    <div
      className="relative flex h-screen w-screen flex-col items-center justify-center gap-2 bg-background p-3 text-foreground"
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
          data-testid="pip-window-toggle"
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
          data-testid="pip-skip"
        >
          <SkipForward className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            resetArmed ? "border-primary text-primary bg-primary/5" : "border-border"
          }`}
          aria-label={resetArmed ? t.app.timer.pip.resetConfirm : t.app.timer.pip.reset}
          title={resetArmed ? t.app.timer.pip.resetConfirm : t.app.timer.pip.reset}
          data-testid="pip-reset"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p className="mt-1 px-2 text-center text-[10px] leading-tight text-muted-foreground">
        {t.app.timer.pip.tabCloseWarning}
      </p>
      <AnimatePresence>
        {visualAlertEvent && (
          <motion.div
            key={visualAlertEvent.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            className="absolute inset-0 flex items-center justify-center bg-background"
            role="status"
            aria-label={alertLabel}
          >
            <motion.div
              initial={prefersReduced ? { scale: 1 } : { scale: 0.6 }}
              animate={{ scale: 1 }}
              exit={prefersReduced ? { scale: 1 } : { scale: 1.1 }}
              transition={{ duration: prefersReduced ? 0 : 0.4, ease: "easeOut" }}
              className="flex h-[80%] w-[80%] max-w-[160px] max-h-[160px] items-center justify-center rounded-3xl bg-primary"
            >
              <Leaf className="h-[55%] w-[55%] text-primary-foreground" aria-hidden />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    pipRoot,
  );
};
