import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT, format } from "@/lib/i18n";

export interface BreathingPattern {
  id: string;
  displayId: "b-478" | "b-box" | "b-deep";
  inhaleSeconds: number;
  holdInSeconds: number;
  exhaleSeconds: number;
  holdOutSeconds: number;
  totalCycles: number;
}

export const breathingPatterns: BreathingPattern[] = [
  {
    id: "478",
    displayId: "b-478",
    inhaleSeconds: 4,
    holdInSeconds: 7,
    exhaleSeconds: 8,
    holdOutSeconds: 0,
    totalCycles: 4,
  },
  {
    id: "box",
    displayId: "b-box",
    inhaleSeconds: 4,
    holdInSeconds: 4,
    exhaleSeconds: 4,
    holdOutSeconds: 4,
    totalCycles: 4,
  },
  {
    id: "deep",
    displayId: "b-deep",
    inhaleSeconds: 5,
    holdInSeconds: 2,
    exhaleSeconds: 6,
    holdOutSeconds: 0,
    totalCycles: 5,
  },
];

type BreathPhase = "inhale" | "holdIn" | "exhale" | "holdOut" | "complete";

interface PhaseConfig {
  label: string;
  duration: number;
  color: string;
  scale: number;
}

interface Props {
  pattern: BreathingPattern;
  onComplete: () => void;
  onClose: () => void;
}

const PHASE_COLORS: Record<BreathPhase, string> = {
  inhale: "hsl(var(--primary))",
  holdIn: "hsl(var(--secondary))",
  exhale: "hsl(var(--primary) / 0.6)",
  holdOut: "hsl(var(--muted-foreground))",
  complete: "hsl(var(--success))",
};

const PHASE_SCALE: Record<BreathPhase, number> = {
  inhale: 1.4,
  holdIn: 1.4,
  exhale: 0.7,
  holdOut: 0.7,
  complete: 1,
};

const getPhaseConfig = (
  phase: BreathPhase,
  pattern: BreathingPattern,
  labels: Record<BreathPhase, string>
): PhaseConfig => {
  const duration =
    phase === "inhale"
      ? pattern.inhaleSeconds
      : phase === "holdIn"
      ? pattern.holdInSeconds
      : phase === "exhale"
      ? pattern.exhaleSeconds
      : phase === "holdOut"
      ? pattern.holdOutSeconds
      : 0;
  return { label: labels[phase], duration, color: PHASE_COLORS[phase], scale: PHASE_SCALE[phase] };
};

const getNextPhase = (phase: BreathPhase, pattern: BreathingPattern): BreathPhase | null => {
  if (phase === "inhale") return pattern.holdInSeconds > 0 ? "holdIn" : "exhale";
  if (phase === "holdIn") return "exhale";
  if (phase === "exhale") return pattern.holdOutSeconds > 0 ? "holdOut" : null;
  if (phase === "holdOut") return null;
  return null;
};

export const BreathingGuide = ({ pattern, onComplete, onClose }: Props) => {
  const { t } = useT();
  const b = t.app.breathing;
  const display = t.app.exercises.display[pattern.displayId];

  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [countdown, setCountdown] = useState(pattern.inhaleSeconds);
  const [cycleCount, setCycleCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<BreathPhase>("inhale");

  const advancePhase = useCallback(() => {
    const currentPhase = phaseRef.current;
    const next = getNextPhase(currentPhase, pattern);

    if (next === null) {
      setCycleCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= pattern.totalCycles) {
          setPhase("complete");
          phaseRef.current = "complete";
          return newCount;
        }
        phaseRef.current = "inhale";
        setPhase("inhale");
        setCountdown(pattern.inhaleSeconds);
        return newCount;
      });
    } else {
      phaseRef.current = next;
      setPhase(next);
      const next_duration =
        next === "holdIn" ? pattern.holdInSeconds : next === "exhale" ? pattern.exhaleSeconds : pattern.holdOutSeconds;
      setCountdown(next_duration);
    }
  }, [pattern]);

  useEffect(() => {
    if (!isStarted || phase === "complete") return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          advancePhase();
          const current = phaseRef.current;
          return current === "inhale"
            ? pattern.inhaleSeconds
            : current === "holdIn"
            ? pattern.holdInSeconds
            : current === "exhale"
            ? pattern.exhaleSeconds
            : pattern.holdOutSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, phase, advancePhase, pattern]);

  useEffect(() => {
    if (phase === "complete") {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(onComplete, 1500);
    }
  }, [phase, onComplete]);

  const phaseConfig = getPhaseConfig(phase, pattern, b.phases);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">{display.name}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label={b.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1.5 justify-center mb-10">
          {Array.from({ length: pattern.totalCycles }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i < cycleCount ? "bg-primary w-6" : i === cycleCount ? "bg-primary/40 w-6" : "bg-muted w-4"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-center mb-10">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {isStarted && phase !== "complete" && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/20"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <motion.div
              className="w-36 h-36 rounded-full flex items-center justify-center"
              animate={{
                scale: isStarted ? phaseConfig.scale : 1,
                backgroundColor: isStarted ? phaseConfig.color : "hsl(var(--muted))",
              }}
              transition={{
                duration: phaseConfig.duration,
                ease: phase === "inhale" ? "easeIn" : phase === "exhale" ? "easeOut" : "linear",
              }}
            >
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phase}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-white font-heading text-2xl"
                  >
                    {phase === "complete" ? "✓" : countdown}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="text-center mb-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-heading text-foreground"
            >
              {phase === "complete" ? b.completedTitle : phaseConfig.label}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm text-muted-foreground mt-2">
            {phase === "complete"
              ? b.completedBody
              : isStarted
              ? format(b.cycleProgress, { current: Math.min(cycleCount + 1, pattern.totalCycles), total: pattern.totalCycles })
              : display.description}
          </p>
        </div>

        {!isStarted ? (
          <Button variant="hero" size="lg" className="w-full" onClick={() => setIsStarted(true)}>
            {b.start}
          </Button>
        ) : phase !== "complete" ? (
          <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
            {b.stop}
          </Button>
        ) : null}
      </motion.div>
    </div>
  );
};
