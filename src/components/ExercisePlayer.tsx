/**
 * ExercisePlayer Component
 *
 * Reusable exercise engine that plays step-based exercises with timers,
 * notifications, and optional background music.
 *
 * Runs in parallel with REST phase timer (does not pause it).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, X } from "lucide-react";
import { Exercise, ExerciseState } from "@/lib/exerciseTypes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExercisePlayerProps {
  exercise: Exercise;
  onComplete: () => void;
  onClose: () => void;
}

export const ExercisePlayer = ({ exercise, onComplete, onClose }: ExercisePlayerProps) => {
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showPreAlert, setShowPreAlert] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [state, setState] = useState<ExerciseState>(() => {
    const firstStep = exercise.steps[0];
    return {
      exercise,
      currentStepIndex: 0,
      stepTimeRemaining: firstStep.durationSeconds,
      totalTimeRemaining: exercise.targetDurationSeconds,
      isPlaying: false,
      isPaused: false,
      musicPlaying: false,
    };
  });

  useEffect(() => {
    if (showPreAlert && exercise.preAlert) {
      toast({ title: "Antes de empezar", description: exercise.preAlert, duration: 4000 });
    }
  }, [showPreAlert, exercise.preAlert, toast]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const playStepSound = useCallback((isStart: boolean) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = isStart ? 600 : 500;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) { /* silent */ }
  }, []);

  const triggerCompletion = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    playStepSound(false);
    setShowCelebration(true);
    setTimeout(() => { setShowCelebration(false); onComplete(); }, 2000);
  }, [onComplete, playStepSound]);

  const advanceStep = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= prev.exercise.steps.length || prev.totalTimeRemaining <= 0) {
        triggerCompletion();
        return prev;
      }
      const nextStep = prev.exercise.steps[nextIndex];
      const stepDuration = Math.min(nextStep.durationSeconds, prev.totalTimeRemaining);
      if (nextStep.notifyOnStart) playStepSound(true);
      return { ...prev, currentStepIndex: nextIndex, stepTimeRemaining: stepDuration };
    });
  }, [triggerCompletion, playStepSound]);

  const stepCompletedRef = useRef(false);

  useEffect(() => {
    if (state.isPlaying && !state.isPaused && state.totalTimeRemaining > 0) {
      const startTime = Date.now();
      const startTotal = state.totalTimeRemaining;
      const startStep = state.stepTimeRemaining;
      stepCompletedRef.current = false;

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newTotal = Math.max(0, startTotal - elapsed);
        const newStep = Math.max(0, startStep - elapsed);

        setState((prev) => {
          if (newStep === 0 && !stepCompletedRef.current && prev.stepTimeRemaining > 0) {
            stepCompletedRef.current = true;
            setTimeout(() => advanceStep(), 100);
            return { ...prev, stepTimeRemaining: 0, totalTimeRemaining: newTotal };
          }
          return { ...prev, stepTimeRemaining: newStep, totalTimeRemaining: newTotal };
        });

        if (newTotal === 0) {
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          setTimeout(() => triggerCompletion(), 300);
        }
      }, 100);
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      stepCompletedRef.current = false;
    }

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      stepCompletedRef.current = false;
    };
  }, [state.isPlaying, state.isPaused, state.totalTimeRemaining, state.stepTimeRemaining, advanceStep, triggerCompletion]);

  const handleStart = useCallback(() => {
    setShowPreAlert(false);
    setState((prev) => ({ ...prev, isPlaying: true }));
    if (exercise.steps[0].notifyOnStart) playStepSound(true);
  }, [exercise.steps, playStepSound]);

  const currentStep = exercise.steps[state.currentStepIndex];
  const stepProgress = currentStep
    ? ((currentStep.durationSeconds - state.stepTimeRemaining) / currentStep.durationSeconds) * 100
    : 0;
  const totalProgress =
    ((exercise.targetDurationSeconds - state.totalTimeRemaining) / exercise.targetDurationSeconds) * 100;

  // Celebración
  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5"
          >
            <span className="text-4xl">✓</span>
          </motion.div>
          <h2 className="font-heading text-2xl text-foreground mb-2">¡Bien hecho!</h2>
          <p className="text-muted-foreground text-sm">{exercise.name} completado</p>
        </motion.div>
      </div>
    );
  }

  // Pre-alert
  if (showPreAlert) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl p-6 max-w-md w-full border border-border/50"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-xl text-foreground">{exercise.name}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          {exercise.preAlert && (
            <div className="bg-muted/50 rounded-xl p-4 mb-5">
              <p className="text-sm text-foreground">{exercise.preAlert}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button variant="hero" className="flex-1" onClick={handleStart}>
              <Play className="h-4 w-4 mr-2" />Empezar
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl p-6 max-w-md w-full border border-border/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-heading text-lg text-foreground">{exercise.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paso {state.currentStepIndex + 1} de {exercise.steps.length}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progreso total */}
        <div className="w-full bg-muted rounded-full h-1 mb-5">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        {/* Paso actual */}
        {currentStep && (
          <div className="mb-5">
            <div className="bg-muted/50 rounded-2xl p-5 mb-3 text-center">
              <p className="text-base font-medium text-foreground mb-3 leading-snug">
                {currentStep.text}
              </p>
              <p className="text-4xl font-heading text-primary">
                {formatTime(state.stepTimeRemaining)}
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-secondary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tiempo restante total */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-5">
          <span>Tiempo restante</span>
          <span className="font-medium">{formatTime(state.totalTimeRemaining)}</span>
        </div>

        {/* Controles */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setState((prev) => ({ ...prev, isPaused: !prev.isPaused }))}
            className="flex-1"
            disabled={!state.isPlaying}
          >
            {state.isPlaying && !state.isPaused ? (
              <><Pause className="h-4 w-4 mr-2" />Pausar</>
            ) : (
              <><Play className="h-4 w-4 mr-2" />{state.isPaused ? "Reanudar" : "Iniciar"}</>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={advanceStep}
            disabled={!state.isPlaying}
            className={cn("flex-1")}
          >
            <SkipForward className="h-4 w-4 mr-2" />Saltar
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
