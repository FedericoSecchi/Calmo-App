import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useSearchParams, Navigate, Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { HOME_PATHS, SEO_PATHS, LEGAL_PATHS, JOIN_PATHS } from "@/lib/i18n/types";
import { SEO_META } from "@/lib/i18n/routes";
import { usePageSEO } from "@/hooks/usePageSEO";
import { useT } from "@/lib/i18n";
import { trackPageView } from "@/lib/analytics";

// Auth-aware routes live under a lazy shell so the public landing / SEO /
// legal pages never pull supabase, framer-motion-heavy providers, or the app
// code into the initial bundle.
const AuthShell = lazy(() => import("./layouts/AuthShell"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AppRoutes = lazy(() => import("./layouts/AppRoutes"));

const SeoPage = lazy(() => import("./pages/seo/SeoPage"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Join = lazy(() => import("./pages/Join"));

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

const AuthShellRoute = () => (
  <Suspense fallback={<PageFallback />}>
    <AuthShell />
  </Suspense>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RedirectHandler />
        <TrailingSlash />
        <Routes>
          <Route path="/" element={<HomePage lang="en" />} />
          <Route path="/es" element={<Navigate to="/es/" replace />} />
          <Route path="/es/" element={<HomePage lang="es" />} />

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

          <Route path={JOIN_PATHS.en} element={<Suspense fallback={<PageFallback />}><Join lang="en" /></Suspense>} />
          <Route path={JOIN_PATHS.es} element={<Suspense fallback={<PageFallback />}><Join lang="es" /></Suspense>} />

          <Route element={<AuthShellRoute />}>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/app/*" element={<AppRoutes />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
