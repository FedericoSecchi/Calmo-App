import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Leaf } from "lucide-react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { useT } from "@/lib/i18n";

export const VisualAlertOverlay = () => {
  const { visualAlertEvent, dismissVisualAlert } = useFocusTimer();
  const { t } = useT();
  const prefersReduced = useReducedMotion();
  const [tabVisible, setTabVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const open = Boolean(visualAlertEvent) && tabVisible;
  const label = visualAlertEvent?.phase === "work"
    ? t.app.timer.visualAlert.workComplete
    : t.app.timer.visualAlert.restComplete;

  const scale = prefersReduced
    ? { initial: { scale: 1 }, animate: { scale: 1 }, exit: { scale: 1 } }
    : {
        initial: { scale: 0.6, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 1.15, opacity: 0 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key={visualAlertEvent?.id ?? "visual-alert"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.25 }}
          onClick={dismissVisualAlert}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label={label}
        >
          <motion.div
            initial={scale.initial}
            animate={scale.animate}
            exit={scale.exit}
            transition={{ duration: prefersReduced ? 0 : 0.4, ease: "easeOut" }}
            className="flex h-48 w-48 items-center justify-center rounded-[2.5rem] bg-primary shadow-xl"
          >
            <Leaf className="h-24 w-24 text-primary-foreground" aria-hidden />
          </motion.div>
          <p className="mt-6 font-heading text-xl text-foreground">{label}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
