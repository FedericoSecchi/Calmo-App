import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Timer, PictureInPicture2, Activity, Droplets, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markOnboardingDone, readOnboardingDone } from "@/lib/onboardingFlag";
import { useT, format } from "@/lib/i18n";
import { track } from "@/lib/analytics";

type StepId = "timer" | "pip" | "exercises" | "hydration" | "social";

const STEP_ORDER: StepId[] = ["timer", "pip", "exercises", "hydration", "social"];

const STEP_ICONS: Record<StepId, typeof Timer> = {
  timer: Timer,
  pip: PictureInPicture2,
  exercises: Activity,
  hydration: Droplets,
  social: Users,
};

interface WelcomeTourProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeTour = ({ open, onClose }: WelcomeTourProps) => {
  const { t } = useT();
  const tour = t.app.tour;
  const prefersReduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const finish = useCallback(
    (skipped: boolean) => {
      markOnboardingDone();
      track("onboarding_complete", { via: "tour", skipped });
      onClose();
    },
    [onClose],
  );

  const stepId = STEP_ORDER[index];
  const stepText = tour.steps[stepId];
  const Icon = STEP_ICONS[stepId];
  const isLast = index === STEP_ORDER.length - 1;

  const stepIndicator = useMemo(
    () => format(tour.stepLabel, { current: index + 1, total: STEP_ORDER.length }),
    [index, tour.stepLabel],
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-tour-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.2 }}
        className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-tour-title"
        data-testid="welcome-tour"
      >
        <motion.div
          key={stepId}
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: prefersReduced ? 0 : 0.2 }}
          className="w-full max-w-md rounded-3xl bg-card border border-border/40 shadow-xl p-6"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-6 w-6 text-primary" aria-hidden />
            </div>
            <button
              type="button"
              onClick={() => finish(true)}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              aria-label={tour.skip}
              data-testid="welcome-tour-skip"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            {stepIndicator}
          </p>
          <h2
            id="welcome-tour-title"
            className="font-heading text-xl text-foreground"
          >
            {stepText.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {stepText.description}
          </p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1" aria-hidden>
              {STEP_ORDER.map((id, i) => (
                <span
                  key={id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-6 bg-primary" : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!isLast && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => finish(true)}
                  data-testid="welcome-tour-skip-text"
                >
                  {tour.skip}
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  if (isLast) finish(false);
                  else setIndex((n) => Math.min(STEP_ORDER.length - 1, n + 1));
                }}
                data-testid="welcome-tour-next"
              >
                {isLast ? tour.done : tour.next}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Returns a stable [shouldShow, markSeen] pair, used by AppLayout to decide
// whether to mount the tour on first app visit.
export function useWelcomeTour(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
} {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!readOnboardingDone()) {
      setIsOpen(true);
    }
  }, []);

  return {
    isOpen,
    open: useCallback(() => setIsOpen(true), []),
    close: useCallback(() => setIsOpen(false), []),
  };
}
