import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import {
  Clock,
  Target,
  Activity,
  ArrowRight,
  ArrowLeft,
  Check,
  Sun,
  Moon,
  Coffee,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { useT, format, writeStoredLang, type Lang } from "@/lib/i18n";
import { ONBOARDING_DONE_KEY, markOnboardingDone, readOnboardingDone } from "@/lib/onboardingFlag";
import { track } from "@/lib/analytics";

type StepId = "schedule" | "goal" | "pain" | "flow" | "preferences";
type GoalId = "discomfort" | "productivity" | "both";
type PainAreaOnboardingId = "lumbar" | "cervical" | "wrist" | "none";
type FlowId = "lumbar" | "cervical";

const stepIds: StepId[] = ["schedule", "goal", "pain", "flow", "preferences"];

const Onboarding = () => {
  const navigate = useNavigate();
  const { t, lang } = useT();
  const o = t.app.onboarding;
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    workStart: "09:00",
    workEnd: "18:00",
    lunchBreak: true,
    goal: "" as "" | GoalId,
    painArea: "" as "" | PainAreaOnboardingId,
    flowMode: "" as "" | FlowId,
    language: lang,
    reduceMotion: false,
  });

  // Someone who already finished the onboarding (or the welcome tour) shouldn't
  // be forced through it again — send them straight to /app.
  useEffect(() => {
    if (readOnboardingDone()) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  const handleNext = () => {
    if (currentStep < stepIds.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (preferences.language !== lang) {
        writeStoredLang(preferences.language as Lang);
      }
      markOnboardingDone();
      track("onboarding_complete", { via: "wizard", skipped: false });
      navigate("/app");
    }
  };

  void ONBOARDING_DONE_KEY;

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepId = stepIds[currentStep];
  const stepText = o.steps[currentStepId];

  const renderStepContent = () => {
    switch (currentStepId) {
      case "schedule":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sun className="h-4 w-4 text-secondary" />
                  {o.schedule.start}
                </label>
                <input
                  type="time"
                  value={preferences.workStart}
                  onChange={(e) => setPreferences({ ...preferences, workStart: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Moon className="h-4 w-4 text-primary" />
                  {o.schedule.end}
                </label>
                <input
                  type="time"
                  value={preferences.workEnd}
                  onChange={(e) => setPreferences({ ...preferences, workEnd: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <button
              onClick={() => setPreferences({ ...preferences, lunchBreak: !preferences.lunchBreak })}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                preferences.lunchBreak
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              <Coffee className={`h-5 w-5 ${preferences.lunchBreak ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left flex-1">
                <p className="font-medium text-foreground">{o.schedule.lunchTitle}</p>
                <p className="text-sm text-muted-foreground">{o.schedule.lunchDescription}</p>
              </div>
              {preferences.lunchBreak && <Check className="h-5 w-5 text-primary" />}
            </button>
          </div>
        );

      case "goal":
        return (
          <div className="space-y-3">
            {(
              [
                { id: "discomfort" as GoalId, Icon: Activity },
                { id: "productivity" as GoalId, Icon: Target },
                { id: "both" as GoalId, Icon: Clock },
              ] as const
            ).map(({ id, Icon }) => {
              const copy = o.goals[id];
              return (
                <button
                  key={id}
                  onClick={() => setPreferences({ ...preferences, goal: id })}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    preferences.goal === id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      preferences.goal === id ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${preferences.goal === id ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-foreground">{copy.label}</p>
                    <p className="text-sm text-muted-foreground">{copy.description}</p>
                  </div>
                  {preferences.goal === id && <Check className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        );

      case "pain":
        return (
          <div className="space-y-3">
            {(["lumbar", "cervical", "wrist", "none"] as PainAreaOnboardingId[]).map((id) => {
              const copy = o.painAreas[id];
              return (
                <button
                  key={id}
                  onClick={() => setPreferences({ ...preferences, painArea: id })}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                    preferences.painArea === id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-foreground">{copy.label}</p>
                    <p className="text-sm text-muted-foreground">{copy.description}</p>
                  </div>
                  {preferences.painArea === id && <Check className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        );

      case "flow":
        return (
          <div className="space-y-4">
            {(
              [
                { id: "lumbar" as FlowId, color: "bg-primary/10 text-primary" },
                { id: "cervical" as FlowId, color: "bg-secondary/10 text-secondary" },
              ] as const
            ).map(({ id, color }) => {
              const copy = o.flows[id];
              return (
                <button
                  key={id}
                  onClick={() => setPreferences({ ...preferences, flowMode: id })}
                  className={`w-full p-6 rounded-2xl border-2 transition-all ${
                    preferences.flowMode === id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mx-auto mb-4`}>
                      <Activity className="h-8 w-8" />
                    </div>
                    <p className="font-heading text-lg text-foreground">{copy.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{copy.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <label className="text-sm font-medium text-foreground mb-3 block">{o.preferences.language}</label>
              <div className="flex gap-2">
                {(["es", "en"] as Lang[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setPreferences({ ...preferences, language: option })}
                    className={`flex-1 py-3 rounded-lg border-2 transition-all font-medium ${
                      preferences.language === option
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    {t.app.settings.languageOptions[option]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setPreferences({ ...preferences, reduceMotion: !preferences.reduceMotion })}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                preferences.reduceMotion
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              <div className="text-left">
                <p className="font-medium text-foreground">{o.preferences.reduceMotionTitle}</p>
                <p className="text-sm text-muted-foreground">{o.preferences.reduceMotionDescription}</p>
              </div>
              <div className={`w-12 h-7 rounded-full transition-colors ${preferences.reduceMotion ? "bg-primary" : "bg-muted"}`}>
                <div
                  className={`w-5 h-5 rounded-full bg-card shadow-sm transition-transform mt-1 ${
                    preferences.reduceMotion ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </div>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <Logo size="sm" />
        <span className="text-sm text-muted-foreground">
          {format(o.stepLabel, { current: currentStep + 1, total: stepIds.length })}
        </span>
      </div>

      <div className="px-4">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / stepIds.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <div className="text-center mb-8 mt-8">
              <h1 className="font-heading text-2xl text-foreground mb-2">{stepText.title}</h1>
              <p className="text-muted-foreground">{stepText.description}</p>
            </div>

            <div className="flex-1">{renderStepContent()}</div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-8 pb-4">
          {currentStep > 0 && (
            <Button variant="outline" size="lg" onClick={handleBack} aria-label={o.back}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Button variant="hero" size="lg" className="flex-1" onClick={handleNext}>
            {currentStep === stepIds.length - 1 ? o.finish : o.next}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Footer variant="minimal" />
    </div>
  );
};

export default Onboarding;
