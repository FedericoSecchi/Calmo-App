import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { useT, format } from "@/lib/i18n";

export const PreEndWarningBanner = () => {
  const { preEndWarning, dismissPreEndWarning } = useFocusTimer();
  const { t } = useT();
  const p = t.app.timer.preEnd;

  const visible = Boolean(preEndWarning?.visible);
  const minutes = preEndWarning ? Math.max(1, Math.round(preEndWarning.seconds / 60)) : 0;
  const text = preEndWarning
    ? format(preEndWarning.phase === "work" ? p.workBanner : p.restBanner, { min: minutes })
    : "";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="pre-end-banner"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="fixed top-16 left-0 right-0 z-50 px-4 pt-4"
          role="status"
          aria-live="polite"
        >
          <div className="max-w-md mx-auto">
            <div className="bg-primary/10 border border-primary/40 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Clock className="h-4 w-4 text-primary" aria-hidden />
                <span>{text}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={dismissPreEndWarning}
                aria-label={p.dismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
