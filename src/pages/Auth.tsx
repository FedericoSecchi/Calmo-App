import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AuthError } from "@supabase/supabase-js";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { HeroBackground } from "@/components/HeroBackground";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { Footer } from "@/components/Footer";
import { useT, format } from "@/lib/i18n";
import { LEGAL_PATHS } from "@/lib/i18n/types";
import { track } from "@/lib/analytics";
import { migrateGuestDataToServer } from "@/lib/guestMigration";

type AuthMode = "login" | "signup";

const MIN_PASSWORD_LENGTH = 8;

function mapAuthError(error: AuthError | Error | null, dict: ReturnType<typeof useT>["t"]) {
  if (!error) return dict.auth.errors.unknown;
  const message = error.message || "";
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("user already")) return dict.auth.errors.emailInUse;
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) return dict.auth.errors.invalidCredentials;
  if (
    lower.includes("password should be at least") ||
    lower.includes("weak password") ||
    lower.includes("password is too short")
  ) {
    return dict.auth.errors.weakPassword;
  }
  if (lower.includes("invalid email") || lower.includes("unable to validate email") || lower.includes("email address is invalid")) {
    return dict.auth.errors.invalidEmail;
  }
  if (lower.includes("too many requests") || lower.includes("rate limit")) {
    return dict.auth.errors.tooManyRequests;
  }
  // Fallback with the underlying reason so the user has a hint.
  return format(dict.auth.errors.unknownWithReason, { reason: message.slice(0, 160) });
}

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session, isGuest, signIn, signUp, signInAsGuest } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const { t } = useT();

  const initialMode: AuthMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const appTarget = searchParams.get("create_room") === "1" ? "/app?create_room=1" : "/app";

  // Redirect only when we have a real session (not just a stale user object).
  useEffect(() => {
    if (user && session && !isGuest) {
      navigate(appTarget, { replace: true });
    }
  }, [user, session, isGuest, navigate, appTarget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast({ title: t.auth.errors.unknown, variant: "destructive" });
      return;
    }
    if (mode === "signup" && password.length < MIN_PASSWORD_LENGTH) {
      // Guard client-side so we don't burn a Supabase 422; the server policy
      // is also 8+, this just gives faster feedback with no network cost.
      toast({ title: t.auth.errors.weakPassword, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      if (mode === "signup") {
        const result = await signUp(email, password);
        if (result.error) {
          toast({ title: mapAuthError(result.error, t), variant: "destructive" });
          setIsLoading(false);
          return;
        }
        track("sign_up");
        if (result.data?.session) {
          await migrateGuestDataToServer(result.data.session.user.id);
        }
        toast({ title: t.auth.toasts.accountCreated });
        navigate(appTarget, { replace: true });
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          toast({ title: mapAuthError(result.error, t), variant: "destructive" });
          setIsLoading(false);
          return;
        }
        track("login");
        if (result.data?.session) {
          await migrateGuestDataToServer(result.data.session.user.id);
        }
        toast({ title: t.auth.toasts.welcomeBack });
        navigate(appTarget, { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    signInAsGuest();
    track("start_guest");
    toast({ title: t.auth.toasts.guestMode });
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <HeroBackground />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-medium">
            <div className="flex justify-center mb-8">
              <Logo size="lg" />
            </div>

            <h1 className="font-heading text-2xl text-center text-foreground mb-2">
              {mode === "login" ? t.auth.titleSignIn : t.auth.titleSignUp}
            </h1>
            <p className="text-center text-muted-foreground text-sm mb-8">
              {mode === "login" ? t.auth.subtitleSignIn : t.auth.subtitleSignUp}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : 1}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signup" && (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <p
                      className={
                        password.length >= MIN_PASSWORD_LENGTH
                          ? "text-success"
                          : "text-muted-foreground"
                      }
                      data-testid="password-rule"
                    >
                      {format(t.auth.passwordMinChars, { n: MIN_PASSWORD_LENGTH })}
                    </p>
                    <p className="text-muted-foreground tabular-nums" data-testid="password-counter">
                      {format(t.auth.passwordCounter, {
                        current: password.length,
                        min: MIN_PASSWORD_LENGTH,
                      })}
                    </p>
                  </div>
                )}
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? t.auth.submitSignIn : t.auth.submitSignUp}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">·</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button variant="outline" size="lg" className="w-full" onClick={handleGuest} disabled={isLoading}>
              {t.auth.tryGuest}
            </Button>

            <div className="mt-6 text-center text-sm">
              {mode === "login" ? (
                <p className="text-muted-foreground">
                  {t.auth.switchToSignUp}{" "}
                  <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                    {t.auth.switchToSignUpAction}
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {t.auth.switchToSignIn}{" "}
                  <button onClick={() => setMode("login")} className="text-primary hover:underline font-medium">
                    {t.auth.switchToSignInAction}
                  </button>
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t.auth.legalIntro}{" "}
            <Link to={LEGAL_PATHS.terms.en} className="underline hover:text-foreground">
              {t.footer.terms}
            </Link>{" "}
            {t.auth.legalAnd}{" "}
            <Link to={LEGAL_PATHS.privacy.en} className="underline hover:text-foreground">
              {t.footer.privacy}
            </Link>
          </p>
        </motion.div>
      </div>
      <Footer variant="minimal" />
    </div>
  );
};

export default Auth;
