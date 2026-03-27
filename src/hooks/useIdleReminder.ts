/**
 * Gentle reminder when user has been idle (no interaction) for a long time.
 * Used to suggest taking a break without reusing the focus timer.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_LAST_IDLE_REMINDER = "calmo_idle_reminder_ts";
const REMINDER_COOLDOWN_MS = 45 * 60 * 1000; // don't show again for 45 min

export function useIdleReminder(onRemind: () => void) {
  const [idleReminderShown, setIdleReminderShown] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const reminderShownAtRef = useRef<number>(0);
  const onRemindRef = useRef(onRemind);
  onRemindRef.current = onRemind;

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleReminderShown(false);
  }, []);

  useEffect(() => {
    const checkIdle = () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const lastStored = parseInt(localStorage.getItem(STORAGE_LAST_IDLE_REMINDER) || "0", 10);
      const cooldownOk = now - Math.max(lastStored, reminderShownAtRef.current) >= REMINDER_COOLDOWN_MS;
      if (elapsed >= IDLE_MS && cooldownOk) {
        reminderShownAtRef.current = now;
        try {
          localStorage.setItem(STORAGE_LAST_IDLE_REMINDER, String(now));
        } catch {}
        setIdleReminderShown(true);
        onRemindRef.current();
      }
    };

    const interval = setInterval(checkIdle, 60 * 1000); // check every minute
    const events: (keyof WindowEventMap)[] = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, markActivity));
    return () => {
      clearInterval(interval);
      events.forEach((e) => window.removeEventListener(e, markActivity));
    };
  }, [markActivity]);

  const dismissIdleReminder = useCallback(() => {
    setIdleReminderShown(false);
  }, []);

  return { idleReminderShown, dismissIdleReminder, markActivity };
}
