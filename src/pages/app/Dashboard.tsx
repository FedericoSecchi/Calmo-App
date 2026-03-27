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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useWaterLogs } from "@/hooks/useWaterLogs";
import { useManualBreakAdjustments } from "@/hooks/useManualBreakAdjustments";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { Button } from "@/components/ui/button";

const WATER_GOAL = 8;

const Dashboard = () => {
  const { toast } = useToast();
  const stats = useDashboardStats();
  const { addWaterGlass, removeWaterGlass, isAdding: isAddingWater } = useWaterLogs();
  const { adjustToday } = useManualBreakAdjustments();
  const {
    isRunning,
    timeRemaining,
    currentPhase,
    selectedPreset,
    formatTime,
    getPresetConfig,
    toggleTimer,
    skipToNextPhase,
  } = useFocusTimer();

  const currentPreset = getPresetConfig(selectedPreset);

  const handleAddWater = () => {
    addWaterGlass();
    toast({ title: "Vaso de agua registrado", description: "¡Bien hecho! Mantente hidratado." });
  };

  const handleRemoveWater = () => {
    removeWaterGlass();
    toast({ title: "Vaso de agua removido", description: "Ajuste realizado." });
  };

  const handleAdjustBreak = (delta: number) => {
    adjustToday(delta);
    toast({ title: delta > 0 ? "Pausa agregada" : "Pausa removida", description: "Ajuste manual realizado." });
  };

  const todayStats = useMemo(() => ({
    breaks: stats.breaksToday,
    water: stats.waterToday,
    timerBreaks: stats.timerBreaksToday,
    manualAdjustment: stats.manualAdjustment,
    breaksThisWeek: stats.breaksThisWeek,
    waterThisWeek: stats.waterThisWeek,
  }), [stats]);

  const waterProgress = Math.min((todayStats.water / WATER_GOAL) * 100, 100);
  const waterDone = todayStats.water >= WATER_GOAL;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[420px] md:max-w-[520px] lg:max-w-[640px] mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="font-heading text-2xl lg:text-3xl text-foreground">Hola 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">Tu día de hoy</p>
      </motion.div>

      {/* Timer Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-5"
      >
        <div className={`rounded-2xl p-6 border transition-colors ${
          currentPhase === "rest"
            ? "bg-secondary/5 border-secondary/20"
            : "bg-card border-border/30"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-foreground leading-none mb-1">
                {formatTime(timeRemaining)}
              </p>
              <p className={`text-sm font-medium mt-1 ${
                currentPhase === "rest" ? "text-secondary" : isRunning ? "text-primary" : "text-muted-foreground"
              }`}>
                {currentPhase === "rest" ? "Tiempo de descanso" : isRunning ? "En foco" : "En pausa"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentPreset.name} · {currentPhase === "work" ? "Trabajo" : "Descanso"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={skipToNextPhase}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
                aria-label={currentPhase === "work" ? "Saltar al descanso" : "Finalizar descanso"}
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
                aria-label={isRunning ? "Pausar" : "Iniciar"}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRunning ? "Pausar" : "Iniciar"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hoy */}
      <section className="mb-8">
        <h2 className="font-heading text-base text-foreground mb-3">Hoy</h2>
        <div className="grid grid-cols-2 gap-3">

          {/* Pausas */}
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
                <button onClick={() => handleAdjustBreak(-1)} className="p-1 rounded-lg hover:bg-muted transition-colors" aria-label="Quitar pausa">
                  <Minus className="h-3.5 w-3.5 text-primary" />
                </button>
                <button onClick={() => handleAdjustBreak(1)} className="p-1 rounded-lg hover:bg-muted transition-colors" aria-label="Agregar pausa">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </button>
              </div>
            </div>
            <p className="text-3xl font-heading text-foreground">{todayStats.breaks}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pausas completadas</p>
            {todayStats.manualAdjustment !== 0 && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                {todayStats.timerBreaks} auto {todayStats.manualAdjustment > 0 ? "+" : ""}{todayStats.manualAdjustment}
              </p>
            )}
          </motion.div>

          {/* Agua con meta y barra */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="bg-card rounded-2xl p-4 border border-border/30 relative group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${waterDone ? "bg-success/10" : "bg-primary/10"}`}>
                <Droplets className={`h-4 w-4 ${waterDone ? "text-success" : "text-primary"}`} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleRemoveWater}
                  disabled={todayStats.water === 0}
                  className="p-1 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                  aria-label="Quitar vaso"
                >
                  <Minus className="h-3.5 w-3.5 text-primary" />
                </button>
                <button
                  onClick={handleAddWater}
                  disabled={isAddingWater}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Agregar vaso"
                >
                  {isAddingWater ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 text-primary" />}
                </button>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-heading text-foreground">{todayStats.water}</p>
              <p className="text-sm text-muted-foreground">/ {WATER_GOAL}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">Vasos de agua</p>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${waterDone ? "bg-success" : "bg-primary"}`}
                style={{ width: `${waterProgress}%` }}
              />
            </div>
            {waterDone && (
              <p className="text-xs text-success mt-1 font-medium">¡Meta alcanzada!</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Esta semana */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-heading text-base text-foreground">Esta semana</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border/30 divide-y divide-border/30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Pausas</span>
            </div>
            <span className="font-heading text-lg text-foreground">{todayStats.breaksThisWeek}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">Vasos de agua</span>
            </div>
            <span className="font-heading text-lg text-foreground">{todayStats.waterThisWeek}</span>
          </div>
        </div>
      </motion.section>

      {/* Acciones rápidas */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
      >
        <h2 className="font-heading text-base text-foreground mb-3">¿Qué querés hacer?</h2>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="lg" className="justify-start h-auto py-3" asChild>
            <Link to="/app/pain">
              <Activity className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Registrar cómo me siento</p>
                <p className="text-xs text-muted-foreground">Registro corporal</p>
              </div>
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="justify-start h-auto py-3" asChild>
            <Link to="/app/exercises">
              <Play className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm">Ejercicio rápido</p>
                <p className="text-xs text-muted-foreground">2 minutos de movilidad</p>
              </div>
            </Link>
          </Button>

          <Button variant="outline" size="lg" className="justify-start h-auto py-3 opacity-50 cursor-not-allowed" disabled>
            <Brain className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-medium text-sm">Meditación</p>
              <p className="text-xs text-muted-foreground">Próximamente</p>
            </div>
          </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default Dashboard;
