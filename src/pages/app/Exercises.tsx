import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Clock, Check, X, Activity, Move, Wind, Brain } from "lucide-react";
import { ExercisePlayer } from "@/components/ExercisePlayer";
import { BreathingGuide, breathingPatterns, type BreathingPattern } from "@/components/BreathingGuide";
import { getExerciseById } from "@/lib/exercises";
import { Exercise as ExerciseType } from "@/lib/exerciseTypes";
import { useT, format } from "@/lib/i18n";

type DisplayCategory = "physical" | "stretch" | "breathing";

interface ExerciseDisplay {
  id: string;
  durationMinutes: number;
  engineId?: string;
  category: DisplayCategory;
}

const physicalExercises: ExerciseDisplay[] = [
  { id: "1", durationMinutes: 2, engineId: "neck-rotation", category: "physical" },
  { id: "7", durationMinutes: 3, engineId: "lumbar-flex", category: "physical" },
  { id: "6", durationMinutes: 1, engineId: "wrist-stretch", category: "physical" },
];

const stretchExercises: ExerciseDisplay[] = [
  { id: "2", durationMinutes: 3, engineId: "shoulder-stretch", category: "stretch" },
  { id: "3", durationMinutes: 2, engineId: "lumbar-flex", category: "stretch" },
  { id: "4", durationMinutes: 3, engineId: "lumbar-flex", category: "stretch" },
  { id: "5", durationMinutes: 2, engineId: "wrist-stretch", category: "stretch" },
  { id: "8", durationMinutes: 2, engineId: "lumbar-flex", category: "stretch" },
];

const breathingExercises: ExerciseDisplay[] = [
  { id: "b-478", durationMinutes: 2, category: "breathing" },
  { id: "b-box", durationMinutes: 2, category: "breathing" },
  { id: "b-deep", durationMinutes: 3, category: "breathing" },
];

const breathingIdToPatternId: Record<string, string> = {
  "b-478": "478",
  "b-box": "box",
  "b-deep": "deep",
};

const Exercises = () => {
  const { t } = useT();
  const e = t.app.exercises;
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDisplay | null>(null);
  const [playingExercise, setPlayingExercise] = useState<ExerciseType | null>(null);
  const [playingBreathing, setPlayingBreathing] = useState<BreathingPattern | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  const label = (ex: ExerciseDisplay) => e.display[ex.id as keyof typeof e.display];
  const durationText = (ex: ExerciseDisplay) => format(e.minutes, { n: ex.durationMinutes });

  const handleStartExercise = (exercise: ExerciseDisplay) => {
    if (exercise.category === "breathing") {
      const patternId = breathingIdToPatternId[exercise.id];
      const pattern = breathingPatterns.find((p) => p.id === patternId);
      if (pattern) {
        setPlayingBreathing(pattern);
        setSelectedExercise(null);
      }
      return;
    }
    if (exercise.engineId) {
      const engineExercise = getExerciseById(exercise.engineId);
      if (engineExercise) {
        setPlayingExercise(engineExercise);
        setSelectedExercise(null);
      }
    }
  };

  const handleExerciseComplete = () => {
    if (playingExercise) {
      if (!completedExercises.includes(playingExercise.id)) {
        setCompletedExercises([...completedExercises, playingExercise.id]);
      }
    }
    setPlayingExercise(null);
  };

  const handleBreathingComplete = () => {
    if (playingBreathing) {
      const displayId = Object.entries(breathingIdToPatternId).find(
        ([, patternId]) => patternId === playingBreathing.id
      )?.[0];
      if (displayId && !completedExercises.includes(displayId)) {
        setCompletedExercises([...completedExercises, displayId]);
      }
    }
    setPlayingBreathing(null);
  };

  const renderExerciseCard = (exercise: ExerciseDisplay, index: number) => {
    const isCompleted = completedExercises.includes(exercise.id);
    const text = label(exercise);
    return (
      <motion.button
        key={exercise.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={() => setSelectedExercise(exercise)}
        className={`text-left p-4 rounded-2xl border-2 transition-all w-full ${
          isCompleted
            ? "border-success/50 bg-success/5"
            : "border-border bg-card hover:border-primary/30 hover:shadow-soft"
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {durationText(exercise)}
          </span>
          {isCompleted && (
            <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
              <Check className="h-4 w-4 text-success-foreground" />
            </div>
          )}
        </div>
        <h3 className="font-heading text-lg text-foreground mb-1">{text.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{text.description}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {durationText(exercise)}
        </div>
      </motion.button>
    );
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    exercises: ExerciseDisplay[],
    isPlaceholder = false
  ) => (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">{icon}</div>
        <h2 className="font-heading text-xl text-foreground">{title}</h2>
      </div>

      {isPlaceholder ? (
        <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
          <p className="text-muted-foreground mb-2">{e.comingSoon}</p>
          <p className="text-sm text-muted-foreground/70">{e.meditationCTA}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">{exercises.map((ex, i) => renderExerciseCard(ex, i))}</div>
      )}
    </motion.section>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[420px] md:max-w-[520px] lg:max-w-[640px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-heading text-2xl lg:text-3xl text-foreground">{e.title}</h1>
        <p className="text-muted-foreground mt-1">{e.subtitle}</p>
      </motion.div>

      {renderSection(e.sections.physical, <Activity className="h-5 w-5 text-primary" />, physicalExercises)}
      {renderSection(e.sections.stretch, <Move className="h-5 w-5 text-primary" />, stretchExercises)}
      {renderSection(e.sections.breathing, <Wind className="h-5 w-5 text-primary" />, breathingExercises)}
      {renderSection(e.sections.meditation, <Brain className="h-5 w-5 text-primary" />, [], true)}

      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedExercise(null)}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(ev) => ev.stopPropagation()}
            className="relative bg-card rounded-2xl p-6 max-w-md w-full shadow-medium border border-border"
          >
            <button
              onClick={() => setSelectedExercise(null)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={t.app.exercises.player.close}
            >
              <X className="h-5 w-5" />
            </button>

            <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
              {durationText(selectedExercise)}
            </span>

            <h2 className="font-heading text-xl text-foreground mt-4 mb-2">{label(selectedExercise).name}</h2>
            <p className="text-muted-foreground mb-4">{label(selectedExercise).description}</p>

            {selectedExercise.category === "breathing" ? (
              <div className="bg-muted rounded-xl p-4 mb-6">
                <h3 className="font-medium text-foreground mb-2">{e.howItWorksTitle}</h3>
                <p className="text-sm text-muted-foreground">{e.howItWorksBreathing}</p>
              </div>
            ) : (
              <div className="bg-muted rounded-xl p-4 mb-6">
                <h3 className="font-medium text-foreground mb-2">{e.instructionsTitle}</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  {e.instructions.map((instr) => (
                    <li key={instr}>{instr}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{durationText(selectedExercise)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedExercise(null)}>
                {e.cancel}
              </Button>
              <Button variant="hero" className="flex-1" onClick={() => handleStartExercise(selectedExercise)}>
                <Play className="h-4 w-4 mr-2" />
                {e.start}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {playingExercise && (
        <ExercisePlayer exercise={playingExercise} onComplete={handleExerciseComplete} onClose={() => setPlayingExercise(null)} />
      )}

      {playingBreathing && (
        <BreathingGuide pattern={playingBreathing} onComplete={handleBreathingComplete} onClose={() => setPlayingBreathing(null)} />
      )}
    </div>
  );
};

export default Exercises;
