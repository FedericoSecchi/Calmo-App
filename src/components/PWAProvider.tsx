/**
 * PWA provider: install prompt, return reminder, idle reminder.
 * Listens for first user interaction so install prompt can be shown later.
 */

import { useEffect, useRef } from "react";
import { usePWA } from "@/hooks/usePWA";
import { useIdleReminder } from "@/hooks/useIdleReminder";
import { useToast } from "@/hooks/use-toast";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { markUserInteracted, daysSinceLastVisit, lastVisitTs } = usePWA();
  const interactedRef = useRef(false);

  const handleRemind = () => {
    toast({
      title: "¿Tomás un descanso?",
      description: "Llevás un rato sin interactuar. Recordá la regla 20-20-20.",
      duration: 6000,
    });
  };

  useIdleReminder(handleRemind);

  // One-time listener: mark user interaction so install banner can show after 2+ days
  useEffect(() => {
    if (interactedRef.current) return;
    const mark = () => {
      if (!interactedRef.current) {
        interactedRef.current = true;
        markUserInteracted();
      }
    };
    window.addEventListener("click", mark, { once: true });
    window.addEventListener("keydown", mark, { once: true });
    window.addEventListener("touchstart", mark, { once: true });
    return () => {
      window.removeEventListener("click", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("touchstart", mark);
    };
  }, [markUserInteracted]);

  // Welcome back after long absence (only once per session)
  const welcomeShownRef = useRef(false);
  useEffect(() => {
    if (welcomeShownRef.current || lastVisitTs === 0) return;
    if (daysSinceLastVisit >= 2) {
      welcomeShownRef.current = true;
      toast({
        title: "¡Bienvenido de nuevo!",
        description: "Qué bueno tenerte otra vez. Tu bienestar nos importa.",
        duration: 5000,
      });
    }
  }, [daysSinceLastVisit, lastVisitTs, toast]);

  return (
    <>
      {children}
      <InstallPromptBanner />
    </>
  );
}
