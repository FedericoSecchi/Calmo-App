import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Dumbbell, Activity, Settings, Play, Pause } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { EndOfFocusDialog } from "@/components/EndOfFocusDialog";
import { ScreenBreakBanner } from "@/components/ScreenBreakBanner";
import { AppBackground } from "@/components/AppBackground";
import { Footer } from "@/components/Footer";
import { useFocusTimer } from "@/contexts/FocusTimerContext";
import { useT, format } from "@/lib/i18n";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isGuest, user } = useAuth();
  const { t } = useT();

  const {
    showEndOfFocusDialog,
    dismissEndOfFocusDialog,
    isRunning,
    timeRemaining,
    formatTime,
    toggleTimer,
    currentPhase,
  } = useFocusTimer();

  const getUserInitials = () => {
    if (!user?.email) return "U";
    const name = user.email.split("@")[0];
    return (name.length >= 2 ? name.substring(0, 2) : name.charAt(0)).toUpperCase();
  };

  const bottomNavItems = [
    { to: "/app", icon: Home, label: t.app.nav.dashboard, end: true },
    { to: "/app/exercises", icon: Dumbbell, label: t.app.nav.exercises },
    null,
    { to: "/app/pain", icon: Activity, label: t.app.nav.pain },
    { to: "/app/settings", icon: Settings, label: t.app.nav.settings },
  ] as const;

  const fabAria = format(
    isRunning ? t.app.timerFab.pauseAria : t.app.timerFab.startAria,
    { time: formatTime(timeRemaining) }
  );

  return (
    <>
      <AppBackground />
      <div className="relative z-10 min-h-screen bg-background">
        <EndOfFocusDialog open={showEndOfFocusDialog} onClose={dismissEndOfFocusDialog} />
        <ScreenBreakBanner />
        <div
          className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <Logo size="sm" />
          <NavLink
            to="/app/settings"
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm touch-manipulation"
          >
            {getUserInitials()}
          </NavLink>
        </div>

        <main className="flex flex-col">
          {isGuest && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center">
              <p className="text-sm text-amber-700 dark:text-amber-400">🎭 {t.app.guestBanner}</p>
            </div>
          )}

          <div className="pt-16 pb-24 flex-1">
            <Outlet />
          </div>
          <Footer variant="minimal" />
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="grid grid-cols-5 items-center h-16 relative">
            {bottomNavItems.map((item) => {
              if (item === null) {
                return (
                  <div key="fab-slot" className="relative flex items-center justify-center h-full">
                    <div className="absolute -top-6 z-10">
                      <button
                        onClick={() => {
                          toggleTimer();
                          navigate("/app/reminders");
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center",
                          "w-16 h-16 rounded-full min-w-[44px] min-h-[44px]",
                          currentPhase === "rest"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-primary text-primary-foreground",
                          "shadow-xl shadow-primary/30",
                          "transition-transform active:scale-95",
                          "border-4 border-background",
                          "touch-manipulation"
                        )}
                        aria-label={fabAria}
                      >
                        {isRunning ? (
                          <>
                            <Pause className="h-6 w-6 mb-0.5" />
                            <span className="text-[9px] font-bold leading-tight">{formatTime(timeRemaining)}</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-6 w-6 mb-0.5" />
                            <span className="text-[9px] font-bold leading-tight">{formatTime(timeRemaining)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              }

              const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

              return (
                <div key={item.to} className="flex items-center justify-center h-full">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                      "min-w-[44px] min-h-[44px] touch-manipulation",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </NavLink>
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default AppLayout;
