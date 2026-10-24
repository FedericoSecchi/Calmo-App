export interface PreEndWarningParams {
  initialPhaseSeconds: number;
  remainingSeconds: number;
  previousRemainingSeconds: number;
  warnBeforeSec: number;
  alreadyFired: boolean;
}

// Returns true the moment `remainingSeconds` crosses below `warnBeforeSec`
// for the first time this phase. Phases shorter than or equal to
// `warnBeforeSec` never fire so the user never gets a warning that lands at
// phase start.
export function shouldFirePreEndWarning({
  initialPhaseSeconds,
  remainingSeconds,
  previousRemainingSeconds,
  warnBeforeSec,
  alreadyFired,
}: PreEndWarningParams): boolean {
  if (warnBeforeSec <= 0) return false;
  if (alreadyFired) return false;
  if (initialPhaseSeconds <= warnBeforeSec) return false;
  return previousRemainingSeconds > warnBeforeSec && remainingSeconds <= warnBeforeSec;
}

export interface TimerTitleParams {
  remainingSeconds: number;
  phaseLabel: string;
  siteName: string;
}

export function formatTimerTitle({ remainingSeconds, phaseLabel, siteName }: TimerTitleParams): string {
  const total = Math.max(0, Math.floor(remainingSeconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const time = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return `${time} · ${phaseLabel} — ${siteName}`;
}
