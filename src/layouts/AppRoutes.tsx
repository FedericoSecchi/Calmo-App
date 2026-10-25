import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FocusTimerProvider } from "@/contexts/FocusTimerContext";
import AppLayout from "./AppLayout";

const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const Exercises = lazy(() => import("@/pages/app/Exercises"));
const Pain = lazy(() => import("@/pages/app/Pain"));
const Settings = lazy(() => import("@/pages/app/Settings"));

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="text-muted-foreground">Loading…</div>
  </div>
);

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

export default function AppRoutes() {
  return (
    <ProtectedRoute>
      <FocusTimerProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
            <Route path="reminders" element={<Navigate to="/app" replace />} />
            <Route path="exercises" element={<Suspense fallback={<PageFallback />}><Exercises /></Suspense>} />
            <Route path="pain" element={<Suspense fallback={<PageFallback />}><Pain /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
          </Route>
        </Routes>
      </FocusTimerProvider>
    </ProtectedRoute>
  );
}
