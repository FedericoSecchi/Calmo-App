import { useEffect, useRef } from "react";
import { usePWA } from "@/hooks/usePWA";
import { useIdleReminder } from "@/hooks/useIdleReminder";
import { useToast } from "@/hooks/use-toast";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { DICTS, getAppLang } from "@/lib/i18n";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { markUserInteracted, daysSinceLastVisit, lastVisitTs } = usePWA();
  const interactedRef = useRef(false);

  const handleRemind = () => {
    const copy = DICTS[getAppLang()].app.pwa.idleReminder;
    toast({ title: copy.title, description: copy.description, duration: 6000 });
  };

  useIdleReminder(handleRemind);

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

  const welcomeShownRef = useRef(false);
  useEffect(() => {
    if (welcomeShownRef.current || lastVisitTs === 0) return;
    if (daysSinceLastVisit >= 2) {
      welcomeShownRef.current = true;
      const copy = DICTS[getAppLang()].app.pwa.welcomeBack;
      toast({ title: copy.title, description: copy.description, duration: 5000 });
    }
  }, [daysSinceLastVisit, lastVisitTs, toast]);

  return (
    <>
      {children}
      <InstallPromptBanner />
    </>
  );
}
