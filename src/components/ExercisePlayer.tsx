import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, X, Music, Music2 } from "lucide-react";
import { Exercise, ExerciseState } from "@/lib/exerciseTypes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useT, format } from "@/lib/i18n";

interface ExercisePlayerProps {
  exercise: Exercise;
  onComplete: () => void;
  onClose: () => void;
}

export const ExercisePlayer = ({ exercise, onComplete, onClose }: ExercisePlayerProps) => {
  const { toast } = useToast();
  const { t } = useT();
  const player = t.app.exercises.player;
  const engineNames = t.app.exercises.engine.names as Record<string, { name: string; preAlert: string }>;
  const engineSteps = t.app.exercises.engine.steps as Record<string, string>;

  const exerciseName = engineNames[exercise.id]?.name ?? exercise.name;
  const exerciseAlert = engineNames[exercise.id]?.preAlert ?? exercise.preAlert;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
    if (showPreAlert && exerciseAlert) {
      toast({ title: player.preAlertTitle, description: exerciseAlert, duration: 4000 });
    }
  }, [showPreAlert, exerciseAlert, player.preAlertTitle, toast]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const playStepSound = useCallback((isStart: boolean) => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = isStart ? 600 : 500;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      /* ignore */
    }
  }, []);

  const triggerCompletion = useCallback(() => {
    playStepSound(false);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      onComplete();
    }, 2000);
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
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          triggerCompletion();
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stepCompletedRef.current = false;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stepCompletedRef.current = false;
    };
  }, [state.isPlaying, state.isPaused, state.totalTimeRemaining, state.stepTimeRemaining, advanceStep, triggerCompletion]);

  const toggleMusic = useCallback(() => {
    if (!exercise.supportsMusic) return;
    setState((prev) => ({ ...prev, musicPlaying: !prev.musicPlaying }));
  }, [exercise.supportsMusic]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleStart = useCallback(() => {
    setShowPreAlert(false);
    setState((prev) => ({ ...prev, isPlaying: true }));
    const firstStep = exercise.steps[0];
    if (firstStep.notifyOnStart) playStepSound(true);
  }, [exercise.steps, playStepSound]);

  const currentStep = exercise.steps[state.currentStepIndex];
  const currentStepText = currentStep ? engineSteps[currentStep.id] ?? currentStep.text : "";
  const stepProgress = currentStep
    ? ((currentStep.durationSeconds - state.stepTimeRemaining) / currentStep.durationSeconds) * 100
    : 0;
  const totalProgress = ((exercise.targetDurationSeconds - state.totalTimeRemaining) / exercise.targetDurationSeconds) * 100;

  if (showCelebration) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6"
          >
            <span className="text-4xl text-success font-heading">✓</span>
          </motion.div>
          <h2 className="font-heading text-2xl text-foreground mb-2">{player.wellDone}</h2>
          <p className="text-muted-foreground text-sm">{format(player.completed, { name: exerciseName })}</p>
        </motion.div>
      </div>
    );
  }

  if (showPreAlert) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card rounded-2xl p-6 max-w-md w-full shadow-lg border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl text-foreground">{exerciseName}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label={player.close}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {exerciseAlert && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground">{exerciseAlert}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {player.cancel}
            </Button>
            <Button variant="hero" className="flex-1" onClick={handleStart}>
              <Play className="h-4 w-4 mr-2" />
              {player.start}
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
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl p-6 max-w-md w-full shadow-lg border border-border"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-xl text-foreground">{exerciseName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {format(player.step, { current: state.currentStepIndex + 1, total: exercise.steps.length })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label={player.close}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {currentStep && (
          <div className="mb-6">
            <div className="bg-muted rounded-xl p-6 mb-4 text-center">
              <p className="text-lg font-medium text-foreground mb-2">{currentStepText}</p>
              <p className="text-3xl font-heading text-primary">{formatTime(state.stepTimeRemaining)}</p>
            </div>

            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${stepProgress}%` }} />
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{player.totalTime}</span>
            <span>{formatTime(state.totalTimeRemaining)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-secondary h-1.5 rounded-full transition-all duration-300" style={{ width: `${totalProgress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
            }}
            className="flex-1"
            disabled={!state.isPlaying && !state.isPaused}
          >
            {state.isPlaying && !state.isPaused ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                {player.pause}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {state.isPaused ? player.resume : player.play}
              </>
            )}
          </Button>

          <Button variant="outline" size="lg" onClick={advanceStep} disabled={!state.isPlaying} className="flex-1">
            <SkipForward className="h-4 w-4 mr-2" />
            {player.skipStep}
          </Button>

          {exercise.supportsMusic && (
            <Button variant="outline" size="icon" onClick={toggleMusic} className={cn(state.musicPlaying && "bg-primary/10")}>
              {state.musicPlaying ? <Music className="h-4 w-4" /> : <Music2 className="h-4 w-4 opacity-50" />}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
