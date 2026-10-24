import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogOut, Globe, Volume2, VolumeX, Moon, Sun, AlertTriangle, Trash2, HardDriveDownload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { clearLocalCalmoData } from "@/lib/guestMigration";
import { useT, writeStoredLang, type Lang } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, user, isGuest } = useAuth();
  const { soundEnabled, setSoundEnabled } = useFocusTimer();
  const { t, lang } = useT();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("calmo_dark_mode") : null;
    if (stored !== null) return stored === "true";
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.localStorage.setItem("calmo_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      /* best-effort; still navigate */
    }
    if (typeof window !== "undefined") {
      window.location.replace("/auth");
    } else {
      navigate("/auth", { replace: true });
    }
  };

  const handleSoundToggle = async () => {
    await setSoundEnabled(!soundEnabled);
  };

  const switchLang = (next: Lang) => {
    writeStoredLang(next);
    track("language_changed", { to: next });
    if (typeof window !== "undefined") window.location.reload();
  };

  const handleDeleteLocal = () => {
    clearLocalCalmoData();
    toast({ title: t.app.settings.deleteLocalDone });
  };

  const handleDeleteAccount = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.rpc("delete_my_account");
      }
    } catch {
      /* silent */
    }
    try {
      await supabase.auth.signOut();
    } catch {
      /* silent */
    }
    clearLocalCalmoData();
    toast({ title: t.app.settings.deleteAccountDone });
    if (typeof window !== "undefined") {
      window.location.replace("/auth");
    } else {
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[420px] md:max-w-[520px] lg:max-w-[640px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl lg:text-3xl text-foreground">{t.app.settings.title}</h1>
        {user?.email && !isGuest && <p className="text-sm text-muted-foreground mt-1">{user.email}</p>}
        {isGuest && <p className="text-sm text-muted-foreground mt-1">{t.app.settings.guestMode}</p>}
      </motion.div>

      <div className="space-y-4">
        <button
          onClick={handleSoundToggle}
          className="w-full bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-colors text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-primary" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">{t.app.settings.sound}</p>
                <p className="text-sm text-muted-foreground">
                  {soundEnabled ? t.app.settings.sounds.on : t.app.settings.sounds.off}
                </p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors shrink-0 ${soundEnabled ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${soundEnabled ? "translate-x-5.5 ml-0.5" : "ml-0.5"}`} />
            </div>
          </div>
        </button>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-colors text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              <div>
                <p className="font-medium">{t.app.settings.darkMode}</p>
                <p className="text-sm text-muted-foreground">
                  {isDarkMode ? t.app.settings.sounds.on : t.app.settings.sounds.off}
                </p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors shrink-0 ${isDarkMode ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${isDarkMode ? "translate-x-5.5 ml-0.5" : "ml-0.5"}`} />
            </div>
          </div>
        </button>

        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="h-5 w-5 text-primary" />
            <p className="font-medium">{t.app.settings.language}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "es"] as Lang[]).map((option) => (
              <button
                key={option}
                onClick={() => switchLang(option)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  lang === option ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {t.app.settings.languageOptions[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-destructive/5 rounded-2xl p-4 border border-destructive/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">{t.app.settings.disclaimer}</p>
          </div>
        </div>

        <Button variant="outline" size="lg" className="w-full" onClick={handleDeleteLocal}>
          <HardDriveDownload className="h-4 w-4 mr-2" />
          {t.app.settings.deleteLocal}
        </Button>

        <Button variant="outline" size="lg" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          {t.app.settings.signOut}
        </Button>

        {!isGuest && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" className="w-full text-destructive hover:text-destructive border-destructive/40 hover:border-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {t.app.settings.deleteAccount}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.app.settings.deleteAccount}</AlertDialogTitle>
                <AlertDialogDescription>{t.app.settings.deleteAccountConfirm}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{lang === "es" ? "Cancelar" : "Cancel"}</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteAccount}>
                  {t.app.settings.deleteAccount}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default Settings;
