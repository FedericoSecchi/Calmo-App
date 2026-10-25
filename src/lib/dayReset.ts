export function getLocalDayString(date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shouldAutoResetDay(params: {
  storedDay: string | null;
  currentDay: string;
  isRunning: boolean;
}): boolean {
  if (params.isRunning) return false;
  if (!params.storedDay) return false;
  return params.storedDay !== params.currentDay;
}
