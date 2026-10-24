import { motion } from "framer-motion";
import {
  Activity,
  Droplets,
  Play,
  Target,
  Plus,
  Minus,
  Loader2,
  Pause,
  Brain,
  SkipForward,
  TrendingUp,
  PictureInPicture2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useWaterLogs } from "@/hooks/useWaterLogs";
import { useManualBreakAdjustments } from "@/hooks/useManualBreakAdjustments";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { Button } from "@/components/ui/button";
import { format, useT } from "@/lib/i18n";

const WATER_GOAL = 8;

const Dashboard = () => {
  const { toast } = useToast();
  const { t } = useT();
  const d = t.app.dashboard;
  const stats = useDashboardStats();
  const { addWaterGlass, removeWaterGlass, isAdding: isAddingWater } = useWaterLogs();
  const { adjustToday } = useManualBreakAdjustments();
  const {
    isRunning,
    timeRemaining,
    currentPhase,
    selectedPreset,
    formatTime,
    toggleTimer,
    skipToNextPhase,
    pipSupported,
    pipOpen,
    openPipWindow,
    closePipWindow,
  } = useFocusTimer();

  const currentPresetName = t.app.presets[selectedPreset].name;

  const handleAddWater = () => {
    addWaterGlass();
    toast({ title: d.toasts.waterAdded, description: d.toasts.waterAddedDesc });
  };

  const handleRemoveWater = () => {
    removeWaterGlass();
    toast({ title: d.toasts.waterRemoved, description: d.toasts.waterRemovedDesc });
  };

  const handleAdjustBreak = (delta: number) => {
    adjustToday(delta);
    toast({
      title: delta > 0 ? d.toasts.breakAdded : d.toasts.breakRemoved,
      description: d.toasts.manualAdjustment,
    });
  };

  const todayStats = useMemo(
    () => ({
      breaks: stats.breaksToday,
      water: stats.waterToday,
      timerBreaks: stats.timerBreaksToday,
      manualAdjustment: stats.manualAdjustment,
      breaksThisWeek: stats.breaksThisWeek,
      waterThisWeek: stats.waterThisWeek,
    }),
    [stats]
  );

  const waterProgress = Math.min((todayStats.water / WATER_GOAL) * 100, 100);
  const waterDone = todayStats.water >= WATER_GOAL;

  const phaseLabel = currentPhase === "rest" ? d.phase.rest : isRunning ? d.phase.inFocus : d.phase.paused;
  const presetSubline = format(d.presetSubline, {
    presetName: currentPresetName,
    phaseLabel: currentPhase === "work" ? d.phaseLabel.work : d.phaseLabel.rest,
  });
  const skipAria = currentPhase === "work" ? d.skipToRestAria : d.skipRestAria;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[420px] md:max-w-[520px] lg:max-w-[640px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="font-heading text-2xl lg:text-3xl text-foreground">{d.greeting}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{d.today}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-5"
      >
        <div
          className={`rounded-2xl p-6 border transition-colors ${
            currentPhase === "rest" ? "bg-secondary/5 border-secondary/20" : "bg-card border-border/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-foreground leading-none mb-1">{formatTime(timeRemaining)}</p>
              <p
                className={`text-sm font-medium mt-1 ${
                  currentPhase === "rest"
                    ? "text-secondary"
                    : isRunning
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {phaseLabel}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{presetSubline}</p>
            </div>
            <div className="flex items-center gap-2">
              {pipSupported && (
                <button
                  onClick={() => (pipOpen ? closePipWindow() : openPipWindow())}
                  className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                  aria-label={t.app.timer.pip.openAria}
                  data-testid="pip-toggle"
                >
                  <PictureInPicture2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={skipToNextPhase}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                aria-label={skipAria}
              >
                <SkipForward className="h-5 w-5" />
              </button>
              <button
                onClick={toggleTimer}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                  isRunning
                    ? "bg-muted text-foreground hover:bg-muted/70"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
                aria-label={isRunning ? d.pause : d.start}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRunning ? d.pause : d.start}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <section className="mb-8">
        <h2 className="font-heading text-base text-foreground mb-3">{d.todaySection}</h2>
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card rounded-2xl p-4 border border-border/30 relative group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleAdjustBreak(-1)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                  aria-label={d.removeBreakAria}
                >
                  <Minus className="h-3.5 w-3.5 text-primary" />
                </button>
                <button
                  onClick={() => handleAdjustBreak(1)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                  aria-label={d.addBreakAria}
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </button>
              </div>
            </div>
            <p className="text-3xl font-heading text-foreground">{todayStats.breaks}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{d.breaksCompleted}</p>
            {todayStats.manualAdjustment !== 0 && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                {format(d.autoAdjustment, {
                  auto: todayStats.timerBreaks,
                  sign: todayStats.manualAdjustment > 0 ? "+" : "",
                  adjustment: todayStats.manualAdjustment,
                })}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="bg-card rounded-2xl p-4 border border-border/30 relative group"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  waterDone ? "bg-success/10" : "bg-primary/10"
                }`}
              >
                <Droplets className={`h-4 w-4 ${waterDone ? "text-success" : "text-primary"}`} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleRemoveWater}
                  disabled={todayStats.water === 0}
                  className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                  aria-label={d.removeWaterAria}
                >
                  <Minus className="h-3.5 w-3.5 text-primary" />
                </button>
                <button
                  onClick={handleAddWater}
                  disabled={isAddingWater}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                  aria-label={d.addWaterAria}
                >
                  {isAddingWater ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-heading text-foreground">{todayStats.water}</p>
              <p className="text-sm text-muted-foreground">/ {WATER_GOAL}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">{d.waterGlasses}</p>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${waterDone ? "bg-success" : "bg-primary"}`}
                style={{ width: `${waterProgress}%` }}
              />
            </div>
            {waterDone && <p className="text-xs text-success mt-1 font-medium">{d.waterGoalReached}</p>}
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-heading text-base text-foreground">{d.thisWeekSection}</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border/30 divide-y divide-border/30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{d.breaks}</span>
            </div>
            <span className="font-heading text-lg text-foreground">{todayStats.breaksThisWeek}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{d.waterGlassesWeek}</span>
            </div>
            <span className="font-heading text-lg text-foreground">{todayStats.waterThisWeek}</span>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
      >
        <h2 className="font-heading text-base text-foreground mb-3">{d.actions}</h2>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="lg" className="justify-start h-auto py-3" asChild>
            <Link to="/app/pain">
              <Activity className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">{d.logFeelingTitle}</p>
                <p className="text-xs text-muted-foreground">{d.logFeelingDesc}</p>
              </div>
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="justify-start h-auto py-3" asChild>
            <Link to="/app/exercises">
              <Play className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">{d.quickExerciseTitle}</p>
                <p className="text-xs text-muted-foreground">{d.quickExerciseDesc}</p>
              </div>
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="justify-start h-auto py-3 opacity-50 cursor-not-allowed" disabled>
            <Brain className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-medium text-sm">{d.meditationTitle}</p>
              <p className="text-xs text-muted-foreground">{d.comingSoon}</p>
            </div>
          </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default Dashboard;
