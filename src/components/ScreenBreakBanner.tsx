import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { useT } from "@/lib/i18n";

export const ScreenBreakBanner = () => {
  const { screenBreak, dismissScreenBreak, snoozeScreenBreak, currentPhase, isRunning } = useFocusTimer();
  const { t } = useT();
  const s = t.app.screenBreak;

  const shouldShow = screenBreak.isOpen && currentPhase === "work";

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="screen-break-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-16 left-0 right-0 z-50 px-4 pt-4 lg:pt-6"
          role="alert"
          aria-live="polite"
        >
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-lg">
              <p className="text-xs text-muted-foreground mb-3 text-center">{s.preAlert}</p>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-1">{s.message}</p>
                    <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
                      {isRunning ? `${screenBreak.countdownSeconds}s` : s.paused}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={snoozeScreenBreak}
                    className="text-xs"
                    aria-label={s.snoozeAria}
                  >
                    {s.snooze}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={dismissScreenBreak}
                    className="text-xs"
                    aria-label={s.doneAria}
                  >
                    {s.done}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
