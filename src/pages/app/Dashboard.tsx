import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  Volume2,
  VolumeX,
  Clock,
  Bell,
  Sparkles,
  RotateCcw,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useWaterLogs } from "@/hooks/useWaterLogs";
import { useManualBreakAdjustments } from "@/hooks/useManualBreakAdjustments";
import { useToast } from "@/hooks/use-toast";
import { useFocusTimer, presets, type PresetId } from "@/contexts/FocusTimerContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, useT } from "@/lib/i18n";

const WATER_GOAL = 8;

const Dashboard = () => {
  const { toast } = useToast();
  const { t } = useT();
  const d = t.app.dashboard;
  const s = t.app.timer.settings;
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
    setPreset,
    setCustomTimings,
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
    warnBeforeSec,
    setWarnBeforeSec,
    autoPipEnabled,
    setAutoPipEnabled,
    visualAlertEnabled,
    setVisualAlertEnabled,
    playTestSound,
    startNewDay,
  } = useFocusTimer();

  const currentPresetName = t.app.presets[selectedPreset].name;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [customWorkMinutes, setCustomWorkMinutes] = useState(45);
  const [customRestMinutes, setCustomRestMinutes] = useState(5);

  const warnOptions: Array<{ value: number; label: string }> = [
    { value: 0, label: t.app.settings.warnBeforeOptions.off },
    { value: 60, label: t.app.settings.warnBeforeOptions.oneMin },
    { value: 120, label: t.app.settings.warnBeforeOptions.twoMin },
    { value: 300, label: t.app.settings.warnBeforeOptions.fiveMin },
  ];

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

  const handlePresetChange = async (preset: PresetId) => {
    if (isRunning) return;
    try {
      await setPreset(preset);
      toast({
        title: s.rhythmUpdatedTitle,
        description: format(s.rhythmUpdatedBody, {
          name: t.app.presets[preset].name,
        }),
      });
    } catch {
      toast({ title: s.rhythmError, variant: "destructive" });
    }
  };

  const handleCustomTimings = () => {
    if (isRunning) return;
    if (customWorkMinutes < 1 || customRestMinutes < 1) {
      toast({ title: s.invalidValues, description: s.invalidValuesDesc, variant: "destructive" });
      return;
    }
    setCustomTimings(customWorkMinutes, customRestMinutes);
    toast({
      title: s.customApplied,
      description: format(s.customAppliedDesc, {
        work: customWorkMinutes,
        rest: customRestMinutes,
      }),
    });
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: s.notificationsEnabledTitle,
          description: s.notificationsEnabledDesc,
        });
      }
    } else if (Notification.permission === "granted") {
      toast({
        title: s.notificationsAlreadyTitle,
        description: s.notificationsAlreadyDesc,
      });
    }
  };

  const handleStartNewDay = () => {
    startNewDay();
    toast({ title: d.toasts.newDayTitle, description: d.toasts.newDayDesc });
  };

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
        className="mb-3"
      >
        <div
          className={`rounded-2xl p-6 border transition-colors ${
            currentPhase === "rest" ? "bg-secondary/5 border-secondary/20" : "bg-card border-border/30"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
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
          {pipSupported && (
            <p className="mt-3 text-[11px] text-muted-foreground leading-snug">
              {t.app.timer.pip.tabCloseWarning}
            </p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.07 }}
        className="mb-5 flex items-center justify-end"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {d.newDay}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{d.newDayConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{d.newDayConfirmBody}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{d.newDayCancel}</AlertDialogCancel>
              <AlertDialogAction onClick={handleStartNewDay}>{d.newDayCta}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.09 }}
        className="mb-6"
      >
        <button
          type="button"
          onClick={() => setSettingsOpen((o) => !o)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/30 hover:border-border/60 transition-colors"
          aria-expanded={settingsOpen}
        >
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{d.timerSettingsTitle}</span>
          </div>
          {settingsOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-4">
                <div className="rounded-2xl border border-border/30 bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    {s.rhythm}
                  </p>
                  <div className="space-y-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetChange(preset.id)}
                        disabled={isRunning}
                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between text-left ${
                          selectedPreset === preset.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-border/80"
                        } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {t.app.presets[preset.id].name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.app.presets[preset.id].interval} · {t.app.presets[preset.id].description}
                          </p>
                        </div>
                        {selectedPreset === preset.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                  {isRunning && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {s.changeWhilePausedHint}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setAdvancedOpen((o) => !o)}
                    disabled={isRunning}
                    className={`mt-3 w-full flex items-center justify-between p-2 rounded-lg border border-border/40 text-xs text-muted-foreground transition ${
                      isRunning ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/40"
                    }`}
                  >
                    <span>{s.advanced}</span>
                    {advancedOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  <AnimatePresence>
                    {advancedOpen && !isRunning && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-3 rounded-lg border border-border/40 p-3">
                          <p className="text-xs font-medium text-foreground">{s.customRhythm}</p>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              {s.workMinutes}
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={customWorkMinutes}
                              onChange={(e) =>
                                setCustomWorkMinutes(Math.max(1, parseInt(e.target.value) || 1))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              {s.restMinutes}
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={customRestMinutes}
                              onChange={(e) =>
                                setCustomRestMinutes(Math.max(1, parseInt(e.target.value) || 1))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                            />
                          </div>
                          <Button onClick={handleCustomTimings} className="w-full" size="sm">
                            {s.applyCustom}
                          </Button>
                          <p className="text-xs text-muted-foreground">{s.customNote}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="rounded-2xl border border-border/30 bg-card p-4 space-y-4">
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="w-full flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {soundEnabled ? (
                        <Volume2 className="h-5 w-5 text-primary" />
                      ) : (
                        <VolumeX className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <p className="font-medium">{s.soundLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {soundEnabled ? s.soundOn : s.soundOff}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-11 h-6 rounded-full transition-colors shrink-0 ${
                        soundEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${
                          soundEnabled ? "translate-x-5.5 ml-0.5" : "ml-0.5"
                        }`}
                      />
                    </div>
                  </button>

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-5 w-5 text-primary" />
                        <p className="text-sm font-medium">{t.app.settings.volume}</p>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground tabular-nums w-8 text-right">
                        {volume}
                      </span>
                    </div>
                    <Slider
                      aria-label={t.app.settings.volume}
                      value={[volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) => setVolume(v[0] ?? 0)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={playTestSound}
                      disabled={!soundEnabled || volume === 0}
                    >
                      {t.app.settings.testSound}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/30 bg-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{t.app.settings.warnBefore}</p>
                      <p className="text-xs text-muted-foreground">{t.app.settings.warnBeforeHint}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {warnOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setWarnBeforeSec(option.value)}
                        className={`p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                          warnBeforeSec === option.value
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {pipSupported && (
                  <button
                    type="button"
                    onClick={() => setAutoPipEnabled(!autoPipEnabled)}
                    className="w-full flex items-center justify-between gap-3 rounded-2xl border border-border/30 bg-card p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <PictureInPicture2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{s.autoPipLabel}</p>
                        <p className="text-xs text-muted-foreground">{s.autoPipDesc}</p>
                      </div>
                    </div>
                    <div
                      className={`w-11 h-6 rounded-full transition-colors shrink-0 ${
                        autoPipEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${
                          autoPipEnabled ? "translate-x-5.5 ml-0.5" : "ml-0.5"
                        }`}
                      />
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setVisualAlertEnabled(!visualAlertEnabled)}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl border border-border/30 bg-card p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{s.visualAlertLabel}</p>
                      <p className="text-xs text-muted-foreground">{s.visualAlertDesc}</p>
                    </div>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full transition-colors shrink-0 ${
                      visualAlertEnabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${
                        visualAlertEnabled ? "translate-x-5.5 ml-0.5" : "ml-0.5"
                      }`}
                    />
                  </div>
                </button>

                <div className="rounded-2xl border border-border/30 bg-muted/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{s.notificationsTitle}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {s.notificationsDesc}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestNotificationPermission}
                      >
                        {s.enableNotifications}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

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
            <p className="text-3xl font-heading text-foreground">{stats.breaksToday}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{d.breaksCompleted}</p>
            {stats.manualAdjustment !== 0 && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                {format(d.autoAdjustment, {
                  auto: stats.timerBreaksToday,
                  sign: stats.manualAdjustment > 0 ? "+" : "",
                  adjustment: stats.manualAdjustment,
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
                  stats.waterToday >= WATER_GOAL ? "bg-success/10" : "bg-primary/10"
                }`}
              >
                <Droplets
                  className={`h-4 w-4 ${
                    stats.waterToday >= WATER_GOAL ? "text-success" : "text-primary"
                  }`}
                />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleRemoveWater}
                  disabled={stats.waterToday === 0}
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
              <p className="text-3xl font-heading text-foreground">{stats.waterToday}</p>
              <p className="text-sm text-muted-foreground">/ {WATER_GOAL}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">{d.waterGlasses}</p>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  stats.waterToday >= WATER_GOAL ? "bg-success" : "bg-primary"
                }`}
                style={{ width: `${Math.min((stats.waterToday / WATER_GOAL) * 100, 100)}%` }}
              />
            </div>
            {stats.waterToday >= WATER_GOAL && (
              <p className="text-xs text-success mt-1 font-medium">{d.waterGoalReached}</p>
            )}
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
            <span className="font-heading text-lg text-foreground">{stats.breaksThisWeek}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{d.waterGlassesWeek}</span>
            </div>
            <span className="font-heading text-lg text-foreground">{stats.waterThisWeek}</span>
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
