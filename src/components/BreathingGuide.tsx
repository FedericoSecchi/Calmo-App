/**
 * BreathingGuide
 *
 * Animated guided breathing exercise component.
 * Supports multiple breathing patterns (4-7-8, box breathing, etc.)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhaleSeconds: number;
  holdInSeconds: number;
  exhaleSeconds: number;
  holdOutSeconds: number;
  totalCycles: number;
}

export const breathingPatterns: BreathingPattern[] = [
  {
    id: "478",
    name: "Respiración 4-7-8",
    description: "Técnica para calmar el sistema nervioso y reducir el estrés",
    inhaleSeconds: 4,
    holdInSeconds: 7,
    exhaleSeconds: 8,
    holdOutSeconds: 0,
    totalCycles: 4,
  },
  {
    id: "box",
    name: "Respiración cuadrada",
    description: "Respiración en caja para mejorar la concentración y el foco",
    inhaleSeconds: 4,
    holdInSeconds: 4,
    exhaleSeconds: 4,
    holdOutSeconds: 4,
    totalCycles: 4,
  },
  {
    id: "deep",
    name: "Respiración profunda",
    description: "Respiración diafragmática para relajación profunda",
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

const getPhaseConfig = (phase: BreathPhase, pattern: BreathingPattern): PhaseConfig => {
  switch (phase) {
    case "inhale":
      return { label: "Inhala", duration: pattern.inhaleSeconds, color: "hsl(var(--primary))", scale: 1.4 };
    case "holdIn":
      return { label: "Sostén", duration: pattern.holdInSeconds, color: "hsl(var(--secondary))", scale: 1.4 };
    case "exhale":
      return { label: "Exhala", duration: pattern.exhaleSeconds, color: "hsl(var(--primary) / 0.6)", scale: 0.7 };
    case "holdOut":
      return { label: "Pausa", duration: pattern.holdOutSeconds, color: "hsl(var(--muted-foreground))", scale: 0.7 };
    case "complete":
      return { label: "Completado", duration: 0, color: "hsl(var(--success))", scale: 1 };
  }
};

const getNextPhase = (phase: BreathPhase, pattern: BreathingPattern): BreathPhase | null => {
  if (phase === "inhale") return pattern.holdInSeconds > 0 ? "holdIn" : "exhale";
  if (phase === "holdIn") return "exhale";
  if (phase === "exhale") return pattern.holdOutSeconds > 0 ? "holdOut" : null; // null means cycle ends
  if (phase === "holdOut") return null;
  return null;
};

export const BreathingGuide = ({ pattern, onComplete, onClose }: Props) => {
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
      // End of one cycle
      setCycleCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= pattern.totalCycles) {
          setPhase("complete");
          phaseRef.current = "complete";
          return newCount;
        }
        // Start next cycle
        phaseRef.current = "inhale";
        setPhase("inhale");
        setCountdown(pattern.inhaleSeconds);
        return newCount;
      });
    } else {
      phaseRef.current = next;
      setPhase(next);
      setCountdown(getPhaseConfig(next, pattern).duration);
    }
  }, [pattern]);

  useEffect(() => {
    if (!isStarted || phase === "complete") return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          advancePhase();
          return getPhaseConfig(phaseRef.current, pattern).duration;
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

  const phaseConfig = getPhaseConfig(phase, pattern);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">{pattern.name}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cycle progress */}
        <div className="flex gap-1.5 justify-center mb-10">
          {Array.from({ length: pattern.totalCycles }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i < cycleCount
                  ? "bg-primary w-6"
                  : i === cycleCount
                  ? "bg-primary/40 w-6"
                  : "bg-muted w-4"
              }`}
            />
          ))}
        </div>

        {/* Breathing circle */}
        <div className="flex items-center justify-center mb-10">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Outer pulsing ring */}
            {isStarted && phase !== "complete" && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/20"
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            {/* Main animated circle */}
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

        {/* Phase label */}
        <div className="text-center mb-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-heading text-foreground"
            >
              {phase === "complete" ? "¡Completado!" : phaseConfig.label}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm text-muted-foreground mt-2">
            {phase === "complete"
              ? "Excelente trabajo. Tómate un momento."
              : isStarted
              ? `Ciclo ${Math.min(cycleCount + 1, pattern.totalCycles)} de ${pattern.totalCycles}`
              : pattern.description}
          </p>
        </div>

        {/* Controls */}
        {!isStarted ? (
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={() => setIsStarted(true)}
          >
            Comenzar
          </Button>
        ) : phase !== "complete" ? (
          <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
            Detener
          </Button>
        ) : null}
      </motion.div>
    </div>
  );
};
