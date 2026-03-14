import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FocusTimerProvider } from "./contexts/FocusTimerContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import AppLayout from "./layouts/AppLayout";
import NotFound from "./pages/NotFound";

// Lazy-loaded app and SEO cluster pages for better initial bundle size
const Dashboard = lazy(() => import("./pages/app/Dashboard"));
const Reminders = lazy(() => import("./pages/app/Reminders"));
const Exercises = lazy(() => import("./pages/app/Exercises"));
const Pain = lazy(() => import("./pages/app/Pain"));
const Settings = lazy(() => import("./pages/app/Settings"));
const PortfolioPage = lazy(() => import("./pages/portfolio/PortfolioPage"));
const CaseStudiesPage = lazy(() => import("./pages/case-studies/CaseStudiesPage"));
const ProgrammaticSeoPage = lazy(() => import("./pages/programmatic-seo/ProgrammaticSeoPage"));
const ImageSeoPage = lazy(() => import("./pages/image-seo/ImageSeoPage"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="text-muted-foreground">Cargando...</div>
  </div>
);

// Component to handle redirect from 404.html
const RedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      // Remove the redirect parameter and navigate to the route
      navigate(redirect, { replace: true });
    }
  }, [searchParams, navigate]);
  
  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  // Allow access if user is authenticated OR is a guest
  if (!user && !isGuest) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// OAuth Callback Handler
const AuthCallback = () => {
  const { loading, user, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If we have a user/session, redirect to app
    if (user || session) {
      navigate("/app", { replace: true });
      return;
    }

    // If no user after loading, there might be an error or the callback failed
    // Wait a bit more for Supabase to process the callback, then redirect to auth
    const timeout = setTimeout(() => {
      if (!user && !session) {
        // Redirect to auth page if callback didn't result in a session
        navigate("/auth", { replace: true });
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [loading, user, session, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-muted-foreground mb-2">Completando inicio de sesión...</div>
        {loading && (
          <div className="text-sm text-muted-foreground">Por favor espera...</div>
        )}
      </div>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RedirectHandler />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/portfolio" element={<Suspense fallback={<PageFallback />}><PortfolioPage /></Suspense>} />
              <Route path="/case-studies" element={<Suspense fallback={<PageFallback />}><CaseStudiesPage /></Suspense>} />
              <Route path="/programmatic-seo" element={<Suspense fallback={<PageFallback />}><ProgrammaticSeoPage /></Suspense>} />
              <Route path="/image-seo" element={<Suspense fallback={<PageFallback />}><ImageSeoPage /></Suspense>} />
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
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
