export function shouldAutoResetDay(params: {
  storedDay: string | null;
  currentDay: string;
  isRunning: boolean;
}): boolean {
  if (params.isRunning) return false;
  if (!params.storedDay) return false;
  return params.storedDay !== params.currentDay;
}
