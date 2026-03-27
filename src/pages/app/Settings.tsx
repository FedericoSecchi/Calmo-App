import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LogOut, Globe, Volume2, VolumeX, Moon, Sun, MessageCircle, Music, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFocusTimer } from "@/contexts/FocusTimerContext";

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, user, isGuest } = useAuth();
  const { soundEnabled, setSoundEnabled } = useFocusTimer();

  // Dark mode state (persisted in localStorage)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("calmo_dark_mode");
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("calmo_dark_mode", String(isDarkMode));
  }, [isDarkMode]);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const handleSoundToggle = async () => {
    await setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[420px] md:max-w-[520px] lg:max-w-[640px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-2xl lg:text-3xl text-foreground">Ajustes</h1>
        {user?.email && !isGuest && (
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        )}
        {isGuest && (
          <p className="text-sm text-muted-foreground mt-1">Modo invitado</p>
        )}
      </motion.div>

      <div className="space-y-4">
        {/* Sonidos - functional */}
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
                <p className="font-medium">Sonidos del timer</p>
                <p className="text-sm text-muted-foreground">
                  {soundEnabled ? "Activado" : "Desactivado"}
                </p>
              </div>
            </div>
            {/* Toggle visual */}
            <div
              className={`w-11 h-6 rounded-full transition-colors shrink-0 ${
                soundEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${
                  soundEnabled ? "translate-x-5.5 ml-0.5" : "ml-0.5"
                }`}
              />
            </div>
          </div>
        </button>

        {/* Modo oscuro - functional */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-colors text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-medium">Modo oscuro</p>
                <p className="text-sm text-muted-foreground">
                  {isDarkMode ? "Activado" : "Desactivado"}
                </p>
              </div>
            </div>
            {/* Toggle visual */}
            <div
              className={`w-11 h-6 rounded-full transition-colors shrink-0 ${
                isDarkMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${
                  isDarkMode ? "translate-x-5.5 ml-0.5" : "ml-0.5"
                }`}
              />
            </div>
          </div>
        </button>

        {/* Idioma - informativo */}
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium">Idioma</p>
              <p className="text-sm text-muted-foreground">Español</p>
            </div>
          </div>
        </div>

        <a
          href="https://t.me/calmo_community"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-secondary" />
            <div className="flex-1">
              <p className="font-medium">Comunidad Telegram</p>
              <p className="text-sm text-muted-foreground">Únete a otros trabajadores remotos</p>
            </div>
          </div>
        </a>

        <a
          href="https://open.spotify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Music className="h-5 w-5 text-success" />
            <div className="flex-1">
              <p className="font-medium">Playlists de enfoque</p>
              <p className="text-sm text-muted-foreground">Música para concentrarse</p>
            </div>
          </div>
        </a>

        <div className="bg-destructive/5 rounded-2xl p-4 border border-destructive/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Calmo no reemplaza diagnóstico ni tratamiento médico. Consulta a un profesional de salud para problemas persistentes.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};

export default Settings;
