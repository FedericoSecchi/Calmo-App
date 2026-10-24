import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FocusTimerProvider } from "./contexts/FocusTimerContext";
import { PWAProvider } from "@/components/PWAProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import AppLayout from "./layouts/AppLayout";
import NotFound from "./pages/NotFound";
import { HOME_PATHS, SEO_PATHS, LEGAL_PATHS } from "@/lib/i18n/types";
import { SEO_META } from "@/lib/i18n/routes";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useT } from "@/lib/i18n";
import { trackPageView } from "@/lib/analytics";

const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Reminders = lazy(() => import("./pages/app/Reminders"));
const Exercises = lazy(() => import("./pages/app/Exercises"));
const Pain = lazy(() => import("./pages/app/Pain"));
const Settings = lazy(() => import("./pages/app/Settings"));
const SeoPage = lazy(() => import("./pages/seo/SeoPage"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="text-muted-foreground">Loading…</div>
  </div>
);

const RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (!redirect) return;
    const rest = new URLSearchParams(searchParams);
    rest.delete("redirect");
    const extra = rest.toString();
    navigate(extra ? `${redirect}?${extra}` : redirect, { replace: true });
  }, [searchParams, navigate]);
  return null;
};

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading, isGuest } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

const HomePage = ({ lang }: { lang: "en" | "es" }) => {
  const { t } = useT();
  const path = HOME_PATHS[lang];
  const altPath = HOME_PATHS[lang === "en" ? "es" : "en"];
  usePageSEO({ title: t.meta.homeTitle, description: t.meta.homeDescription, path, altPath, lang });
  useEffect(() => {
    trackPageView();
  }, []);
  return <Index />;
};

const TrailingSlash = () => {
  const location = useLocation();
  const path = location.pathname;
  const needsSlash = path !== "/" && !path.endsWith("/") && !path.startsWith("/app") && !path.startsWith("/auth") && !path.startsWith("/onboarding");
  if (needsSlash) {
    return <Navigate to={`${path}/${location.search}`} replace />;
  }
  return null;
};

const SEO_KEYS = Object.keys(SEO_PATHS) as Array<keyof typeof SEO_PATHS>;

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <PWAProvider>
            <BrowserRouter>
              <RedirectHandler />
              <TrailingSlash />
              <Routes>
                <Route path="/" element={<HomePage lang="en" />} />
                <Route path="/es" element={<Navigate to="/es/" replace />} />
                <Route path="/es/" element={<HomePage lang="es" />} />

                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<Onboarding />} />

                {SEO_KEYS.map((key) => (
                  <Route
                    key={`${key}-en`}
                    path={SEO_PATHS[key].en}
                    element={
                      <Suspense fallback={<PageFallback />}>
                        <SeoPage pageKey={key} lang="en" title={SEO_META[key].en.title} description={SEO_META[key].en.description} />
                      </Suspense>
                    }
                  />
                ))}
                {SEO_KEYS.map((key) => (
                  <Route
                    key={`${key}-es`}
                    path={SEO_PATHS[key].es}
                    element={
                      <Suspense fallback={<PageFallback />}>
                        <SeoPage pageKey={key} lang="es" title={SEO_META[key].es.title} description={SEO_META[key].es.description} />
                      </Suspense>
                    }
                  />
                ))}

                <Route path={LEGAL_PATHS.privacy.en} element={<Suspense fallback={<PageFallback />}><Privacy /></Suspense>} />
                <Route path={LEGAL_PATHS.privacy.es} element={<Suspense fallback={<PageFallback />}><Privacy /></Suspense>} />
                <Route path={LEGAL_PATHS.terms.en} element={<Suspense fallback={<PageFallback />}><Terms /></Suspense>} />
                <Route path={LEGAL_PATHS.terms.es} element={<Suspense fallback={<PageFallback />}><Terms /></Suspense>} />

                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <FocusTimerProvider>
                        <AppLayout />
                      </FocusTimerProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
                  <Route path="reminders" element={<Suspense fallback={<PageFallback />}><Reminders /></Suspense>} />
                  <Route path="exercises" element={<Suspense fallback={<PageFallback />}><Exercises /></Suspense>} />
                  <Route path="pain" element={<Suspense fallback={<PageFallback />}><Pain /></Suspense>} />
                  <Route path="settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </PWAProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
