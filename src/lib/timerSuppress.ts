// Tiny shared flag so the ActiveRoomContext can tell the FocusTimerContext
// "I'm driving the UI timer now — please stop writing to document.title and
// stop auto-opening PiP for your own personal timer".
//
// Lives in a plain module instead of a React context so the FocusTimerContext
// can read it inside effects without creating a cyclic import.

let suppressed = false;

export function setPersonalTimerSuppressed(value: boolean): void {
  suppressed = value;
}

export function isPersonalTimerSuppressed(): boolean {
  return suppressed;
}
