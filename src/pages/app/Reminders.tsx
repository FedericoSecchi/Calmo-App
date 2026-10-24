import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SkipForward,
  Bell,
  Volume2,
  VolumeX,
  Check,
  Loader2,
  Coffee,
  Briefcase,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Settings,
} from "lucide-react";
import { useReminderSettings } from "@/hooks/useReminderSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFocusTimer, presets, type PresetId } from "@/contexts/FocusTimerContext";
import { ExercisePlayer } from "@/components/ExercisePlayer";
import { getExerciseById } from "@/lib/exercises";
import { Exercise as ExerciseType } from "@/lib/exerciseTypes";
import { useT, format } from "@/lib/i18n";

const Reminders = () => {
  const { isGuest } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isUpdating } = useReminderSettings();
  const { t } = useT();
  const r = t.app.reminders;

  const focusTimerContext = useFocusTimer();
  const {
    currentPhase,
    timeRemaining,
    isRunning,
    selectedPreset,
    soundEnabled,
    skipToNextPhase,
    setPreset,
    setCustomTimings,
    setSoundEnabled,
    formatTime,
    getPresetConfig,
    lastRestCompletion,
    startTimer,
  } = focusTimerContext;

  const shouldShowRhythmModal = searchParams.get("from") === "dashboard" && !isRunning;
  const [rhythmModalOpen, setRhythmModalOpen] = useState(false);

  useEffect(() => {
    if (shouldShowRhythmModal) {
      setRhythmModalOpen(true);
    }
  }, [shouldShowRhythmModal]);

  const presetConfig = getPresetConfig(selectedPreset);
  const presetName = (id: PresetId) => t.app.presets[id].name;
  const presetDescription = (id: PresetId) => t.app.presets[id].description;
  const presetInterval = (id: PresetId) => t.app.presets[id].interval;

  const [showExerciseRecommendation, setShowExerciseRecommendation] = useState(false);
  const [playingExercise, setPlayingExercise] = useState<ExerciseType | null>(null);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [customWorkMinutes, setCustomWorkMinutes] = useState(45);
  const [customRestMinutes, setCustomRestMinutes] = useState(5);
  const [showResetWarning, setShowResetWarning] = useState(false);

  useEffect(() => {
    if (currentPhase === "work" && !isRunning && timeRemaining > 0) {
      const now = Date.now();
      if (now - lastRestCompletion < 5000 && lastRestCompletion > 0) {
        setShowExerciseRecommendation(true);
      }
    } else {
      setShowExerciseRecommendation(false);
    }
  }, [currentPhase, isRunning, timeRemaining, lastRestCompletion]);

  const handlePresetChange = async (preset: PresetId) => {
    if (isRunning) return;
    if (!isRunning && timeRemaining > 0) {
      setShowResetWarning(true);
      setTimeout(() => setShowResetWarning(false), 5000);
    }
    try {
      await setPreset(preset);
      if (!isGuest) {
        toast({
          title: r.toasts.settingsSaved,
          description: format(r.toasts.rhythmUpdated, { name: presetName(preset) }),
        });
      }
    } catch {
      toast({ title: r.toasts.saveError, variant: "destructive" });
    }
  };

  const handleCustomTimings = () => {
    if (isRunning) return;
    if (customWorkMinutes < 1 || customRestMinutes < 1) {
      toast({ title: r.toasts.invalidValues, description: r.toasts.invalidValuesDesc, variant: "destructive" });
      return;
    }
    if (!isRunning && timeRemaining > 0) {
      setShowResetWarning(true);
      setTimeout(() => setShowResetWarning(false), 5000);
    }
    setCustomTimings(customWorkMinutes, customRestMinutes);
    toast({
      title: r.toasts.customApplied,
      description: format(r.toasts.customAppliedDesc, { work: customWorkMinutes, rest: customRestMinutes }),
    });
  };

  const handleRhythmSelect = async (presetId: PresetId) => {
    try {
      setRhythmModalOpen(false);
      setSearchParams({}, { replace: true });
      await setPreset(presetId);
      startTimer();
      toast({
        title: r.toasts.focusStarted,
        description: format(r.toasts.focusStartedDesc, { name: presetName(presetId) }),
      });
    } catch {
      toast({ title: r.toasts.focusError, variant: "destructive" });
      setRhythmModalOpen(true);
    }
  };

  const handleSoundToggle = async () => {
    try {
      await setSoundEnabled(!soundEnabled);
    } catch {
      /* context handles revert */
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: r.toasts.notificationsEnabled,
          description: isGuest
            ? r.toasts.notificationsEnabledGuestDesc
            : r.toasts.notificationsEnabledDesc,
        });
      }
    } else if (Notification.permission === "granted") {
      toast({ title: r.toasts.notificationsAlready, description: r.toasts.notificationsAlreadyDesc });
    }
  };

  const restMinutes = presetConfig.restMinutes;
  const restAfterText = format(r.restAfter, { min: restMinutes });
  const restContinuesText = format(r.restContinues, { min: restMinutes });

  return (
    <>
      <Dialog
        open={rhythmModalOpen}
        onOpenChange={(open) => {
          setRhythmModalOpen(open);
          if (!open) setSearchParams({}, { replace: true });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{r.rhythmModalTitle}</DialogTitle>
            <DialogDescription>{r.rhythmModalDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleRhythmSelect(preset.id)}
                disabled={isUpdating}
                className="w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed border-border bg-card"
              >
                <div>
                  <p className="font-medium text-foreground">{presetName(preset.id)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{presetDescription(preset.id)}</p>
                </div>
                {isUpdating ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="p-4 md:p-6 lg:p-8 max-w-[420px] md:max-w-[520px] lg:max-w-[640px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="font-heading text-2xl lg:text-3xl text-foreground">{r.title}</h1>
          <p className="text-muted-foreground mt-1">{r.subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`bg-card rounded-3xl p-8 border-2 shadow-soft mb-8 text-center transition-colors ${
            currentPhase === "work" ? "border-primary/30 bg-primary/5" : "border-secondary/30 bg-secondary/5"
          }`}
        >
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors ${
              currentPhase === "work" ? "bg-primary/10" : "bg-secondary/10"
            }`}
          >
            {currentPhase === "work" ? (
              <Briefcase className="h-12 w-12 text-primary" />
            ) : (
              <Coffee className="h-12 w-12 text-secondary" />
            )}
          </div>

          <p className="text-6xl font-heading text-foreground mb-2">{formatTime(timeRemaining)}</p>
          <div className="mb-8">
            <p className={`text-lg font-medium mb-1 ${currentPhase === "work" ? "text-primary" : "text-secondary"}`}>
              {currentPhase === "work" ? r.workTime : r.restTime}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentPhase === "work" ? restAfterText : restContinuesText}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSoundToggle}
              className="h-12 w-12 rounded-xl"
              disabled={isUpdating}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={skipToNextPhase}
              className="h-12 w-12 rounded-xl"
              title={currentPhase === "work" ? r.skipToRestTitle : r.finishRestTitle}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="font-heading text-lg text-foreground mb-4">{r.frequency}</h2>
          <div className="space-y-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetChange(preset.id)}
                disabled={isUpdating || isRunning}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                  selectedPreset === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-border/80"
                } ${isUpdating || isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                title={isRunning ? r.changeRhythmHint : undefined}
              >
                <div className="text-left">
                  <p className="font-medium text-foreground">{presetName(preset.id)}</p>
                  <p className="text-sm text-muted-foreground">
                    {presetInterval(preset.id)} • {presetDescription(preset.id)}
                  </p>
                </div>
                {selectedPreset === preset.id &&
                  (isUpdating ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 text-primary" />
                  ))}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {isRunning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 p-3 rounded-xl bg-muted/50 border border-border/50"
              >
                <p className="text-sm text-foreground font-medium mb-1">{r.pauseFirstTitle}</p>
                <p className="text-xs text-muted-foreground">{r.pauseFirstDescription}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showResetWarning && !isRunning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
              >
                <p className="text-sm text-foreground font-medium">{r.rhythmResetHint}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              disabled={isRunning}
              className={`w-full flex items-center justify-between p-3 rounded-xl border border-border/50 transition-all ${
                isRunning ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{r.advanced}</span>
              </div>
              {advancedOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {advancedOpen && !isRunning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 p-4 rounded-xl border border-border/50 bg-card/50"
                >
                  <p className="text-sm font-medium text-foreground mb-3">{r.customRhythm}</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{r.workMinutes}</label>
                      <input
                        type="number"
                        min="1"
                        value={customWorkMinutes}
                        onChange={(e) => setCustomWorkMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{r.restMinutes}</label>
                      <input
                        type="number"
                        min="1"
                        value={customRestMinutes}
                        onChange={(e) => setCustomRestMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                      />
                    </div>
                    <Button onClick={handleCustomTimings} className="w-full" size="sm">
                      {r.applyCustom}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">{r.customNote}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {showExerciseRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-1">{r.recommendTitle}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{r.recommendDescription}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowExerciseRecommendation(false)}>
                      {r.maybeLater}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="text-primary-foreground"
                      onClick={() => {
                        const suggestedExercise = getExerciseById("neck-rotation");
                        if (suggestedExercise) {
                          setShowExerciseRecommendation(false);
                          setPlayingExercise(suggestedExercise);
                        } else {
                          setShowExerciseRecommendation(false);
                          navigate("/app/exercises");
                        }
                      }}
                    >
                      {r.startExercise}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="bg-muted rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1">{r.notificationsTitle}</h3>
                <p className="text-sm text-muted-foreground mb-3">{r.notificationsDescription}</p>
                <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
                  {r.enableNotifications}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {playingExercise && (
          <ExercisePlayer
            exercise={playingExercise}
            onComplete={() => setPlayingExercise(null)}
            onClose={() => setPlayingExercise(null)}
          />
        )}
      </div>
    </>
  );
};

export default Reminders;
