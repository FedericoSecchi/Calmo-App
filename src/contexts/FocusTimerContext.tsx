/**
 * FocusTimerContext
 * 
 * Global timer context for work/rest focus cycles.
 * Timer persists across route changes and continues running independently of page lifecycle.
 * 
 * Features:
 * - Two phases: WORK (countdown to break) and REST (break duration)
 * - Fully automatic cycle: WORK → REST → WORK continues indefinitely
 * - Persists to localStorage and continues accurately after page reload
 * - Notifications and sound on phase transitions
 * - Single source of truth for timer state across the app
 */

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { useBreakLogs } from "@/hooks/useBreakLogs";
import { useToast } from "@/hooks/use-toast";
import { useReminderSettings } from "@/hooks/useReminderSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useT, format as fmt } from "@/lib/i18n";
import { useTimerPrefs, type WarnBeforeSec } from "@/hooks/useTimerPrefs";
import {
  playFocusEndSound,
  playBreakEndSound,
  playPreEndSound,
  playCountdownBlip,
} from "@/lib/timerAudio";
import { shouldFirePreEndWarning, formatTimerTitle } from "@/lib/timer";
import { track } from "@/lib/analytics";

const TIMER_STORAGE_KEY = "calmo_reminder_timer_state";

export type TimerPhase = "work" | "rest";
export type PresetId = "light" | "standard" | "focus";

export interface PresetConfig {
  id: PresetId;
  workMinutes: number;
  restMinutes: number;
}

export interface ScreenBreakState {
  isOpen: boolean;
  countdownSeconds: number;
  lastTriggerWorkElapsed: number;
  snoozed: boolean;
  snoozeTargetWorkElapsed: number | null;
}

export const presets: PresetConfig[] = [
  { id: "light", workMinutes: 60, restMinutes: 10 },
  { id: "standard", workMinutes: 45, restMinutes: 5 },
  { id: "focus", workMinutes: 90, restMinutes: 10 },
];

interface TimerState {
  phase: TimerPhase;
  remainingSeconds: number;
  lastTickTimestamp: number;
  isRunning: boolean;
  presetId: PresetId;
}

interface ScreenBreakState {
  isOpen: boolean;
  countdownSeconds: number;
  lastTriggerWorkElapsed: number;
  snoozed: boolean;
  snoozeTargetWorkElapsed: number | null;
}

interface FocusTimerContextType {
  // State
  currentPhase: TimerPhase;
  timeRemaining: number; // in seconds
  isRunning: boolean;
  selectedPreset: PresetId;
  soundEnabled: boolean;
  volume: number; // 0..100
  warnBeforeSec: WarnBeforeSec;
  preEndWarning: { visible: boolean; phase: TimerPhase; seconds: number } | null;
  pipSupported: boolean;
  pipOpen: boolean;
  pipRoot: HTMLElement | null;
  lastRestCompletion: number; // Timestamp of last REST completion (for exercise recommendation)
  showEndOfFocusDialog: boolean; // Flag to show end-of-focus UI when REST completes
  providerId: string; // Unique ID to prove single provider instance
  workElapsedSeconds: number; // Total WORK time elapsed (only increments during WORK phase when running)
  screenBreak: ScreenBreakState;

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  toggleTimer: () => void;
  skipToNextPhase: () => void;
  setPreset: (preset: PresetId) => void;
  setCustomTimings: (workMinutes: number, restMinutes: number) => void; // Set custom timings (session-only, doesn't persist)
  setSoundEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setWarnBeforeSec: (sec: number) => void;
  playTestSound: () => void;
  openPipWindow: () => Promise<void>;
  closePipWindow: () => void;
  dismissPreEndWarning: () => void;
  dismissEndOfFocusDialog: () => void; // Dismiss the end-of-focus dialog
  dismissScreenBreak: () => void; // Dismiss screen break (Listo)
  snoozeScreenBreak: () => void; // Snooze screen break for 5 minutes

  // Helpers
  getPresetConfig: (presetId: PresetId) => PresetConfig;
  formatTime: (seconds: number) => string;
}

const FocusTimerContext = createContext<FocusTimerContextType | undefined>(undefined);

export const useFocusTimer = () => {
  const context = useContext(FocusTimerContext);
  if (context === undefined) {
    throw new Error("useFocusTimer must be used within a FocusTimerProvider");
  }
  return context;
};

interface FocusTimerProviderProps {
  children: ReactNode;
}

export const FocusTimerProvider = ({ children }: FocusTimerProviderProps) => {
  const { isGuest } = useAuth();
  const { toast } = useToast();
  const { t } = useT();
  const { settings, updateSettings } = useReminderSettings();
  const { logBreak } = useBreakLogs();
  const { volume, setVolume, warnBeforeSec, setWarnBeforeSec } = useTimerPrefs();
  
  // Create stable unique ID for this provider instance (proves single provider)
  const getProviderId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `provider-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };
  const providerIdRef = useRef<string>(getProviderId());
  const providerId = providerIdRef.current;
  
  // Log provider ID in DEV mode
  if (import.meta.env.DEV) {
    console.debug("[FocusTimerProvider] Provider ID:", providerId);
  }
  
  // Get preset config helper
  const getPresetConfig = useCallback((presetId: PresetId): PresetConfig => {
    return presets.find(p => p.id === presetId) || presets[1]; // Default to standard
  }, []);

  // Load timer state from localStorage
  const loadTimerState = useCallback((): { phase: TimerPhase; remaining: number; running: boolean } | null => {
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!stored) return null;
      
      const state: TimerState = JSON.parse(stored);
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - state.lastTickTimestamp) / 1000);
      
      // If timer was running, compute remaining time
      let remaining = state.remainingSeconds;
      if (state.isRunning && elapsedSeconds > 0) {
        remaining = Math.max(0, state.remainingSeconds - elapsedSeconds);
      }
      
      // If WORK phase finished while app was closed, transition to REST
      if (state.phase === "work" && remaining === 0 && state.isRunning) {
        const config = getPresetConfig(state.presetId);
        return { phase: "rest", remaining: config.restMinutes * 60, running: false };
      }
      
      // If REST phase finished while app was closed, transition to WORK
      if (state.phase === "rest" && remaining === 0 && state.isRunning) {
        const config = getPresetConfig(state.presetId);
        return { phase: "work", remaining: config.workMinutes * 60, running: false };
      }
      
      return { phase: state.phase, remaining, running: state.isRunning && remaining > 0 };
    } catch (e) {
      if (import.meta.env.DEV) {
        console.debug("Failed to load timer state:", e);
      }
      return null;
    }
  }, [getPresetConfig]);

  // Initialize state from settings and localStorage
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(
    settings?.preset || "standard"
  );
  const [soundEnabled, setSoundEnabledState] = useState(settings?.sound_enabled ?? true);
  
  const savedState = loadTimerState();
  const presetConfig = getPresetConfig(selectedPreset);
  
  const [currentPhase, setCurrentPhase] = useState<TimerPhase>(
    savedState?.phase || "work"
  );
  const [isRunning, setIsRunning] = useState(
    savedState?.running || false
  );
  const [timeRemaining, setTimeRemaining] = useState(
    savedState?.remaining ?? presetConfig.workMinutes * 60
  );
  const [lastRestCompletion, setLastRestCompletion] = useState<number>(0);
  const [showEndOfFocusDialog, setShowEndOfFocusDialog] = useState<boolean>(false);
  // Custom timings (session-only, doesn't persist)
  const [customRestMinutes, setCustomRestMinutes] = useState<number | null>(null);
  
  // Screen break state
  const SCREEN_BREAK_STORAGE_KEY = "calmo_screen_break_state";
  const loadScreenBreakState = useCallback((): ScreenBreakState | null => {
    try {
      const stored = localStorage.getItem(SCREEN_BREAK_STORAGE_KEY);
      if (!stored) return null;
      const state = JSON.parse(stored);
      // Check if it's from today (reset daily)
      const today = new Date().toDateString();
      if (state.date !== today) return null;
      return state;
    } catch (e) {
      return null;
    }
  }, []);
  
  const savedScreenBreakState = loadScreenBreakState();
  const [workElapsedSeconds, setWorkElapsedSeconds] = useState<number>(0);
  const [screenBreak, setScreenBreak] = useState<ScreenBreakState>({
    isOpen: false,
    countdownSeconds: 20,
    lastTriggerWorkElapsed: savedScreenBreakState?.lastTriggerWorkElapsed ?? 0,
    snoozed: false,
    snoozeTargetWorkElapsed: null,
  });

  // Sync with database settings
  useEffect(() => {
    if (settings && !isGuest) {
      setSelectedPreset(settings.preset);
      setSoundEnabledState(settings.sound_enabled);
    }
  }, [settings, isGuest]);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    const state: TimerState = {
      phase: currentPhase,
      remainingSeconds: timeRemaining,
      lastTickTimestamp: Date.now(),
      isRunning,
      presetId: selectedPreset,
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  }, [currentPhase, timeRemaining, isRunning, selectedPreset]);

  // App badge when screen break (20-20-20) is active - PWA retention
  useEffect(() => {
    const nav = window.navigator as Navigator & { setAppBadge?: (count: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (typeof nav.setAppBadge !== "function" || typeof nav.clearAppBadge !== "function") return;
    if (screenBreak.isOpen) {
      nav.setAppBadge(1).catch(() => {});
    } else {
      nav.clearAppBadge().catch(() => {});
    }
  }, [screenBreak.isOpen]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTransitionRef = useRef(false);
  const lastTransitionTimestampRef = useRef<number>(0);

  // Audio volume scalar (0..1), derived from the user's 0..100 slider.
  const effectiveVolume = soundEnabled ? volume / 100 : 0;
  const effectiveVolumeRef = useRef(effectiveVolume);
  useEffect(() => {
    effectiveVolumeRef.current = effectiveVolume;
  }, [effectiveVolume]);

  // Pre-end warning tracking.
  const initialPhaseSecondsRef = useRef<number>(timeRemaining);
  const previousRemainingRef = useRef<number>(timeRemaining);
  const preEndFiredRef = useRef<boolean>(false);
  const warnBeforeRef = useRef<WarnBeforeSec>(warnBeforeSec);
  useEffect(() => {
    warnBeforeRef.current = warnBeforeSec;
  }, [warnBeforeSec]);
  const [preEndWarning, setPreEndWarning] = useState<
    { visible: boolean; phase: TimerPhase; seconds: number } | null
  >(null);
  const preEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Document Picture-in-Picture.
  const pipWindowRef = useRef<Window | null>(null);
  const pipSupported =
    typeof window !== "undefined" && "documentPictureInPicture" in window;
  const [pipOpen, setPipOpen] = useState(false);
  const [pipRoot, setPipRoot] = useState<HTMLDivElement | null>(null);

  // Helper function to trigger notification and sound
  const triggerNotificationAndSound = useCallback(
    (title: string, body: string, isWorkToRest: boolean) => {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(title, { body, icon: "/icon-192.png" });
        } catch {
          /* ignore */
        }
      }
      const v = effectiveVolumeRef.current;
      if (v > 0) {
        if (isWorkToRest) {
          playFocusEndSound(v);
        } else {
          playBreakEndSound(v);
        }
      }
    },
    [],
  );

  const lastCountdownSecondRef = useRef<number>(-1);

  // Timer countdown logic - uses Date.now() diff for accuracy
  const workStartTimeRef = useRef<number | null>(null);
  const lastWorkElapsedRef = useRef<number>(0);
  
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const startTime = Date.now();
      const startRemaining = timeRemaining;
      
      // Track work elapsed time
      if (currentPhase === "work" && workStartTimeRef.current === null) {
        workStartTimeRef.current = Date.now();
      }
      
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newRemaining = Math.max(0, startRemaining - elapsed);
        const currentSecond = Math.floor(newRemaining);
        
        setTimeRemaining(newRemaining);
        
        // Track work elapsed seconds (only during WORK phase when running)
        if (currentPhase === "work" && isRunning) {
          if (workStartTimeRef.current === null) {
            workStartTimeRef.current = Date.now();
          }
          const workElapsed = Math.floor((Date.now() - workStartTimeRef.current) / 1000) + lastWorkElapsedRef.current;
          setWorkElapsedSeconds(workElapsed);
          
          // Check for 20-minute trigger (1200 seconds)
          const SCREEN_BREAK_INTERVAL = 1200; // 20 minutes
          const shouldTrigger = 
            !screenBreak.isOpen &&
            workElapsed >= SCREEN_BREAK_INTERVAL &&
            Math.floor(workElapsed / SCREEN_BREAK_INTERVAL) > Math.floor(screenBreak.lastTriggerWorkElapsed / SCREEN_BREAK_INTERVAL);
          
          // Check for snooze trigger
          const shouldTriggerSnooze = 
            !screenBreak.isOpen &&
            screenBreak.snoozeTargetWorkElapsed !== null &&
            workElapsed >= screenBreak.snoozeTargetWorkElapsed;
          
          if (shouldTrigger || shouldTriggerSnooze) {
            playCountdownBlip(effectiveVolumeRef.current, 5);
            setScreenBreak(prev => ({
              isOpen: true,
              countdownSeconds: 20,
              lastTriggerWorkElapsed: workElapsed,
              snoozed: shouldTriggerSnooze,
              snoozeTargetWorkElapsed: null,
            }));
          }
        } else {
          // Reset work tracking when not in WORK phase
          if (currentPhase !== "work") {
            workStartTimeRef.current = null;
            lastWorkElapsedRef.current = workElapsedSeconds;
          }
        }

        // Pre-end warning (fire once per phase when crossing threshold).
        const prevRemaining = previousRemainingRef.current;
        if (
          shouldFirePreEndWarning({
            initialPhaseSeconds: initialPhaseSecondsRef.current,
            remainingSeconds: newRemaining,
            previousRemainingSeconds: prevRemaining,
            warnBeforeSec: warnBeforeRef.current,
            alreadyFired: preEndFiredRef.current,
          })
        ) {
          preEndFiredRef.current = true;
          const warnSec = warnBeforeRef.current;
          playPreEndSound(effectiveVolumeRef.current);
          setPreEndWarning({ visible: true, phase: currentPhase, seconds: warnSec });
          if (preEndTimeoutRef.current) clearTimeout(preEndTimeoutRef.current);
          preEndTimeoutRef.current = setTimeout(() => {
            setPreEndWarning(null);
          }, 12_000);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              const minutes = Math.round(warnSec / 60);
              const title =
                currentPhase === "work"
                  ? t.app.timer.notifications.preEndWorkTitle
                  : t.app.timer.notifications.preEndRestTitle;
              const body = fmt(
                currentPhase === "work"
                  ? t.app.timer.notifications.preEndWorkBody
                  : t.app.timer.notifications.preEndRestBody,
                { min: minutes },
              );
              new Notification(title, { body, icon: "/icon-192.png" });
            } catch {
              /* ignore */
            }
          }
        }
        previousRemainingRef.current = newRemaining;

        // Countdown alerts at 10, 5, 3, 2, 1 seconds
        const alertSeconds = [10, 5, 3, 2, 1];
        if (alertSeconds.includes(currentSecond) && currentSecond !== lastCountdownSecondRef.current) {
          lastCountdownSecondRef.current = currentSecond;
          playCountdownBlip(effectiveVolumeRef.current, currentSecond);

          // Show subtle toast for final seconds (1-3)
          if (currentSecond <= 3) {
            const title =
              currentSecond === 1
                ? t.app.timer.toasts.countdownSecond
                : fmt(t.app.timer.toasts.countdownSecondsPlural, { n: currentSecond });
            toast({
              title,
              description:
                currentSecond === 1
                  ? currentPhase === "work"
                    ? t.app.timer.toasts.countdownBackToRest
                    : t.app.timer.toasts.countdownBackToWork
                  : undefined,
              duration: 1000,
            });
          }
        }

        if (newRemaining === 0) {
          setIsRunning(false);
          lastCountdownSecondRef.current = -1; // Reset for next phase
        }
      }, 100); // Check every 100ms for smoother updates
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastCountdownSecondRef.current = -1; // Reset when paused
    }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [isRunning, timeRemaining, currentPhase, toast, screenBreak.isOpen, screenBreak.lastTriggerWorkElapsed, screenBreak.snoozeTargetWorkElapsed, workElapsedSeconds, t]);

  // Handle timer completion and phase transitions
  useEffect(() => {
    if (timeRemaining === 0 && !isRunning && !phaseTransitionRef.current) {
      phaseTransitionRef.current = true;
      const config = getPresetConfig(selectedPreset);
      const now = Date.now();
      const timeSinceLastTransition = now - lastTransitionTimestampRef.current;

      // Only trigger notifications/sound if this is a fresh transition
      const isFreshTransition = timeSinceLastTransition > 2000 || lastTransitionTimestampRef.current === 0;

      if (currentPhase === "work") {
        // WORK phase completed - automatically switch to REST and start timer
        setCurrentPhase("rest");
        // Use custom rest minutes if set, otherwise use preset config
        const restMinutes = customRestMinutes ?? config.restMinutes;
        setTimeRemaining(restMinutes * 60);
        
        if (isFreshTransition) {
          triggerNotificationAndSound(
            t.app.timer.notifications.timeToBreakTitle,
            t.app.timer.notifications.timeToBreakBody,
            true
          );

          toast({
            title: t.app.timer.toasts.restStartedTitle,
            description: fmt(t.app.timer.toasts.restStartedDesc, { min: config.restMinutes }),
          });
        }
        
        // Automatically start REST timer
        setTimeout(() => {
          setIsRunning(true);
        }, 500);
        
        lastTransitionTimestampRef.current = now;
      } else {
        // REST phase completed - automatically switch back to WORK and start timer
        setCurrentPhase("work");
        setTimeRemaining(config.workMinutes * 60);
        setLastRestCompletion(now); // Record timestamp of REST completion
        
        if (isFreshTransition) {
          // Log the completed break (counts as habit)
          logBreak("reminder");
          
          // Show end-of-focus dialog (calm, non-blocking UI)
          setShowEndOfFocusDialog(true);
          
          triggerNotificationAndSound(
            t.app.timer.notifications.breakCompletedTitle,
            t.app.timer.notifications.breakCompletedBody,
            false
          );

          toast({
            title: t.app.timer.toasts.breakCompletedTitle,
            description: t.app.timer.toasts.breakCompletedDesc,
          });
        }
        
        // Automatically start WORK timer
        setTimeout(() => {
          setIsRunning(true);
        }, 500);
        
        lastTransitionTimestampRef.current = now;
      }

      // Reset transition flag after a short delay
      setTimeout(() => {
        phaseTransitionRef.current = false;
      }, 1000);
    } else if (timeRemaining > 0) {
      phaseTransitionRef.current = false;
    }
  }, [timeRemaining, isRunning, currentPhase, selectedPreset, getPresetConfig, triggerNotificationAndSound, toast, logBreak]);

  // Screen break countdown logic
  useEffect(() => {
    if (screenBreak.isOpen && isRunning && currentPhase === "work" && screenBreak.countdownSeconds > 0) {
      const countdownInterval = setInterval(() => {
        setScreenBreak(prev => {
          if (prev.countdownSeconds <= 1) {
            // Auto-dismiss when countdown reaches 0
            playCountdownBlip(effectiveVolumeRef.current, 1);
            const today = new Date().toDateString();
            localStorage.setItem(SCREEN_BREAK_STORAGE_KEY, JSON.stringify({
              date: today,
              lastTriggerWorkElapsed: prev.lastTriggerWorkElapsed,
            }));
            return {
              ...prev,
              isOpen: false,
              countdownSeconds: 20,
            };
          }
          return {
            ...prev,
            countdownSeconds: prev.countdownSeconds - 1,
          };
        });
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [screenBreak.isOpen, screenBreak.countdownSeconds, isRunning, currentPhase, screenBreak.lastTriggerWorkElapsed]);

  // Reset work elapsed on phase transition
  useEffect(() => {
    if (currentPhase === "rest") {
      workStartTimeRef.current = null;
      lastWorkElapsedRef.current = workElapsedSeconds;
    } else if (currentPhase === "work" && !isRunning) {
      // When pausing, save current elapsed time
      if (workStartTimeRef.current !== null) {
        const elapsed = Math.floor((Date.now() - workStartTimeRef.current) / 1000);
        lastWorkElapsedRef.current = workElapsedSeconds;
        workStartTimeRef.current = null;
      }
    }
  }, [currentPhase, isRunning, workElapsedSeconds]);

  // Actions
  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const skipToNextPhase = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(0); // Trigger phase completion
  }, []);

  const setPreset = useCallback(async (preset: PresetId) => {
    // Prevent preset change while timer is running (defensive guard)
    // This should not be reached if UI properly disables the controls,
    // but provides safety in case of direct calls
    if (isRunning) {
      if (import.meta.env.DEV) {
        console.warn("[FocusTimerContext] Attempted to change preset while timer is running");
      }
      return;
    }

    const oldPreset = selectedPreset;
    setSelectedPreset(preset);
    
    // Reset timer to work phase with new preset duration
    const config = getPresetConfig(preset);
    setCurrentPhase("work");
    setTimeRemaining(config.workMinutes * 60);
    setCustomRestMinutes(null); // Clear custom timings when switching to preset
    setIsRunning(false);
    
    if (!isGuest) {
      try {
        await updateSettings({ preset });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error updating reminder settings:", error);
        }
        // Revert on error
        setSelectedPreset(oldPreset);
        const oldConfig = getPresetConfig(oldPreset);
        setTimeRemaining(oldConfig.workMinutes * 60);
        throw error; // Re-throw so caller can handle
      }
    }
  }, [isGuest, updateSettings, selectedPreset, getPresetConfig, isRunning]);

  const setCustomTimings = useCallback((workMinutes: number, restMinutes: number) => {
    // Prevent timing change while timer is running
    if (isRunning) {
      if (import.meta.env.DEV) {
        console.warn("[FocusTimerContext] Attempted to change timings while timer is running");
      }
      return;
    }

    // Validate inputs
    if (workMinutes < 1 || restMinutes < 1) {
      if (import.meta.env.DEV) {
        console.warn("[FocusTimerContext] Invalid timings: workMinutes and restMinutes must be >= 1");
      }
      return;
    }

    // Set custom timings (session-only, doesn't change selectedPreset)
    // This allows temporary custom presets without persisting
    setCurrentPhase("work");
    setTimeRemaining(workMinutes * 60);
    setCustomRestMinutes(restMinutes);
    setIsRunning(false);
  }, [isRunning]);

  const setSoundEnabled = useCallback(async (enabled: boolean) => {
    setSoundEnabledState(enabled);
    
    if (!isGuest) {
      try {
        await updateSettings({ sound_enabled: enabled });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error updating sound setting:", error);
        }
      }
    }
  }, [isGuest, updateSettings]);

  const dismissEndOfFocusDialog = useCallback(() => {
    setShowEndOfFocusDialog(false);
  }, []);
  
  const dismissScreenBreak = useCallback(() => {
    const today = new Date().toDateString();
    localStorage.setItem(SCREEN_BREAK_STORAGE_KEY, JSON.stringify({
      date: today,
      lastTriggerWorkElapsed: screenBreak.lastTriggerWorkElapsed,
    }));
    setScreenBreak(prev => ({
      ...prev,
      isOpen: false,
      countdownSeconds: 20,
    }));
  }, [screenBreak.lastTriggerWorkElapsed]);
  
  const snoozeScreenBreak = useCallback(() => {
    const snoozeTarget = workElapsedSeconds + 300; // 5 minutes = 300 seconds
    setScreenBreak(prev => ({
      ...prev,
      isOpen: false,
      countdownSeconds: 20,
      snoozed: true,
      snoozeTargetWorkElapsed: snoozeTarget,
    }));
  }, [workElapsedSeconds]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const playTestSound = useCallback(() => {
    const v = soundEnabled ? volume / 100 : volume / 100;
    playFocusEndSound(v > 0 ? v : 0.5);
  }, [soundEnabled, volume]);

  const dismissPreEndWarning = useCallback(() => {
    if (preEndTimeoutRef.current) {
      clearTimeout(preEndTimeoutRef.current);
      preEndTimeoutRef.current = null;
    }
    setPreEndWarning(null);
  }, []);

  const closePipWindow = useCallback(() => {
    if (pipWindowRef.current) {
      try {
        pipWindowRef.current.close();
      } catch {
        /* ignore */
      }
    }
    pipWindowRef.current = null;
    setPipRoot(null);
    setPipOpen(false);
  }, []);

  const openPipWindow = useCallback(async () => {
    if (!pipSupported || typeof window === "undefined") return;
    if (pipWindowRef.current) {
      try {
        pipWindowRef.current.focus();
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const api = (window as unknown as {
        documentPictureInPicture: { requestWindow: (opts: { width: number; height: number }) => Promise<Window> };
      }).documentPictureInPicture;
      const pipWin = await api.requestWindow({ width: 320, height: 180 });
      // Copy host stylesheets into the PiP document so Calmo styles apply.
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const styleTag = pipWin.document.createElement("style");
          const rules = Array.from((sheet as CSSStyleSheet).cssRules ?? []);
          styleTag.textContent = rules.map((r) => r.cssText).join("\n");
          pipWin.document.head.appendChild(styleTag);
        } catch {
          if ((sheet as CSSStyleSheet).href) {
            const link = pipWin.document.createElement("link");
            link.rel = "stylesheet";
            link.href = (sheet as CSSStyleSheet).href as string;
            pipWin.document.head.appendChild(link);
          }
        }
      }
      pipWin.document.body.classList.add(...document.body.classList);
      pipWin.document.documentElement.classList.add(...document.documentElement.classList);
      pipWin.document.body.style.margin = "0";
      pipWin.document.body.style.background = "transparent";
      const root = pipWin.document.createElement("div");
      root.id = "calmo-pip-root";
      pipWin.document.body.appendChild(root);
      pipWindowRef.current = pipWin;
      setPipRoot(root);
      setPipOpen(true);
      track("focus_started", { via: "pip" });
      pipWin.addEventListener("pagehide", () => {
        pipWindowRef.current = null;
        setPipRoot(null);
        setPipOpen(false);
      });
    } catch {
      /* feature failed — leave state unchanged */
    }
  }, [pipSupported]);

  // Reset pre-end warning tracking on phase change / preset change.
  useEffect(() => {
    const config = getPresetConfig(selectedPreset);
    const phaseTotal =
      currentPhase === "work"
        ? config.workMinutes * 60
        : (customRestMinutes ?? config.restMinutes) * 60;
    initialPhaseSecondsRef.current = phaseTotal;
    previousRemainingRef.current = timeRemaining;
    preEndFiredRef.current = false;
    setPreEndWarning(null);
    if (preEndTimeoutRef.current) {
      clearTimeout(preEndTimeoutRef.current);
      preEndTimeoutRef.current = null;
    }
    // We intentionally do NOT depend on timeRemaining — we only want to
    // reset when the phase or preset changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, selectedPreset, customRestMinutes]);

  // Tab title countdown while the timer is running.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const defaultTitle = `${t.meta.siteName} — ${t.meta.tagline}`;
    if (!isRunning) {
      document.title = defaultTitle;
      return;
    }
    const phaseLabel =
      currentPhase === "work" ? t.app.timer.titles.focus : t.app.timer.titles.rest;
    document.title = formatTimerTitle({
      remainingSeconds: timeRemaining,
      phaseLabel,
      siteName: t.meta.siteName,
    });
    return () => {
      document.title = defaultTitle;
    };
  }, [isRunning, currentPhase, timeRemaining, t]);

  // Close PiP window when the host document unmounts.
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        try {
          pipWindowRef.current.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const value: FocusTimerContextType = {
    currentPhase,
    timeRemaining,
    isRunning,
    selectedPreset,
    soundEnabled,
    volume,
    warnBeforeSec,
    preEndWarning,
    pipSupported,
    pipOpen,
    pipRoot,
    lastRestCompletion,
    showEndOfFocusDialog,
    providerId,
    workElapsedSeconds,
    screenBreak,
    startTimer,
    pauseTimer,
    toggleTimer,
    skipToNextPhase,
    setPreset,
    setCustomTimings,
    setSoundEnabled,
    setVolume,
    setWarnBeforeSec,
    playTestSound,
    openPipWindow,
    closePipWindow,
    dismissPreEndWarning,
    dismissEndOfFocusDialog,
    dismissScreenBreak,
    snoozeScreenBreak,
    getPresetConfig,
    formatTime,
  };

  return (
    <FocusTimerContext.Provider value={value}>
      {children}
    </FocusTimerContext.Provider>
  );
};

