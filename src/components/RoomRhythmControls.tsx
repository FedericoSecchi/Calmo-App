import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ROOM_MAX_BREAK_MIN,
  ROOM_MAX_FOCUS_MIN,
  ROOM_MIN_BREAK_MIN,
  ROOM_MIN_FOCUS_MIN,
  ROOM_RHYTHMS,
  type RoomPresetId,
  type RoomRhythmId,
} from "@/hooks/useFocusRoom";
import { format, useT } from "@/lib/i18n";

interface RoomRhythmControlsProps {
  phaseRunning: boolean;
  rhythmId: RoomRhythmId;
  focusSec: number;
  breakSec: number;
  onPreset: (id: RoomPresetId) => void;
  onCustom: (workMinutes: number, restMinutes: number) => void;
  titleOverride?: string;
  headingHint?: string;
}

// Shared panel used both inside the Room page and in Home's rhythm section
// when a room is active. Keeps the three presets + "Advanced" numeric inputs
// in one place so the UI never drifts between the two surfaces.
export const RoomRhythmControls = ({
  phaseRunning,
  rhythmId,
  focusSec,
  breakSec,
  onPreset,
  onCustom,
  titleOverride,
  headingHint,
}: RoomRhythmControlsProps) => {
  const { t } = useT();
  const roomT = t.app.room;
  const s = t.app.timer.settings;

  const workMin = Math.max(1, Math.round(focusSec / 60));
  const restMin = Math.max(1, Math.round(breakSec / 60));

  const [advancedOpen, setAdvancedOpen] = useState(rhythmId === "custom");
  const [workDraft, setWorkDraft] = useState<number>(workMin);
  const [restDraft, setRestDraft] = useState<number>(restMin);

  // Keep the draft in sync with the current room state when switching rooms
  // or when the rhythm changes from another client — but only while the user
  // isn't actively editing (otherwise their typing fights the sync).
  useEffect(() => {
    setWorkDraft(workMin);
    setRestDraft(restMin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rhythmId, focusSec, breakSec]);

  useEffect(() => {
    if (rhythmId === "custom") setAdvancedOpen(true);
  }, [rhythmId]);

  const handleApplyCustom = () => {
    if (phaseRunning) return;
    const w = Math.max(ROOM_MIN_FOCUS_MIN, Math.min(ROOM_MAX_FOCUS_MIN, workDraft || ROOM_MIN_FOCUS_MIN));
    const b = Math.max(ROOM_MIN_BREAK_MIN, Math.min(ROOM_MAX_BREAK_MIN, restDraft || ROOM_MIN_BREAK_MIN));
    setWorkDraft(w);
    setRestDraft(b);
    onCustom(w, b);
  };

  const customLabel = format(t.app.presets.custom.description, {
    work: workMin,
    rest: restMin,
  });

  return (
    <div className="mt-5" data-testid="room-rhythm-controls">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {titleOverride ?? roomT.rhythmLabel}
      </p>
      {headingHint && (
        <p className="text-xs text-muted-foreground mb-2">{headingHint}</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {Object.values(ROOM_RHYTHMS).map((rhythm) => {
          const isActive = rhythmId === rhythm.id;
          return (
            <button
              key={rhythm.id}
              type="button"
              onClick={() => onPreset(rhythm.id as RoomPresetId)}
              disabled={phaseRunning}
              className={`p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                isActive
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-border/80"
              } ${phaseRunning ? "opacity-50 cursor-not-allowed" : ""}`}
              data-testid={`room-rhythm-${rhythm.id}`}
            >
              {t.app.presets[rhythm.id as RoomPresetId].name}
            </button>
          );
        })}
      </div>

      {rhythmId === "custom" && (
        <p className="mt-2 text-xs text-muted-foreground" data-testid="room-rhythm-custom-label">
          <Check className="inline h-3 w-3 mr-1 text-primary align-text-top" />
          {t.app.presets.custom.name} · {customLabel}
        </p>
      )}

      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        disabled={phaseRunning}
        className={`mt-3 w-full flex items-center justify-between p-2 rounded-lg border border-border/40 text-xs text-muted-foreground transition ${
          phaseRunning ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/40"
        }`}
        data-testid="room-rhythm-advanced-toggle"
      >
        <span>{s.advanced}</span>
        {advancedOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>

      <AnimatePresence>
        {advancedOpen && !phaseRunning && (
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
                  min={ROOM_MIN_FOCUS_MIN}
                  max={ROOM_MAX_FOCUS_MIN}
                  value={workDraft}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setWorkDraft(Number.isFinite(n) ? n : ROOM_MIN_FOCUS_MIN);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  data-testid="room-rhythm-work-input"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {s.restMinutes}
                </label>
                <input
                  type="number"
                  min={ROOM_MIN_BREAK_MIN}
                  max={ROOM_MAX_BREAK_MIN}
                  value={restDraft}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setRestDraft(Number.isFinite(n) ? n : ROOM_MIN_BREAK_MIN);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  data-testid="room-rhythm-rest-input"
                />
              </div>
              <Button
                onClick={handleApplyCustom}
                className="w-full"
                size="sm"
                data-testid="room-rhythm-apply-custom"
              >
                {s.applyCustom}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {phaseRunning && (
        <p className="mt-2 text-xs text-muted-foreground">{roomT.rhythmChangeHint}</p>
      )}
    </div>
  );
};
