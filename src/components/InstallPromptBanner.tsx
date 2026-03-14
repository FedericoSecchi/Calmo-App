/**
 * Minimal install prompt shown only after user interaction and when not installed.
 * Shown after 2+ consecutive days to encourage installation.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function InstallPromptBanner() {
  const { canShowInstallBanner, promptInstall, dismissInstallPrompt } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    const outcome = await promptInstall();
    setIsInstalling(false);
    if (outcome === "accepted") dismissInstallPrompt();
  };

  if (!canShowInstallBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-24 left-4 right-4 z-30 md:left-auto md:right-4 md:max-w-sm"
        role="dialog"
        aria-label="Instalar Calmo"
      >
        <div className="bg-card border border-border rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">Instalá Calmo</p>
            <p className="text-xs text-muted-foreground">Acceso rápido desde tu escritorio o inicio</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="default"
              onClick={handleInstall}
              disabled={isInstalling}
              className="text-xs"
            >
              {isInstalling ? "..." : "Instalar"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={dismissInstallPrompt}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
