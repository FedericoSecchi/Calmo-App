import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FocusTimerProvider } from "@/contexts/FocusTimerContext";
import AppLayout from "./AppLayout";

const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const Exercises = lazy(() => import("@/pages/app/Exercises"));
const Pain = lazy(() => import("@/pages/app/Pain"));
const Settings = lazy(() => import("@/pages/app/Settings"));
const Room = lazy(() => import("@/pages/app/Room"));

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="text-muted-foreground">Loading…</div>
  </div>
);

// Rooms are joinable from a share link, so anyone landing on /app/room/:code
// enters guest mode automatically if they're not already signed in.
const isRoomPath = (pathname: string) => /^\/app\/room\/[a-z0-9]{8}\/?$/.test(pathname);

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, loading, isGuest, signInAsGuest } = useAuth();
  const location = useLocation();
  const roomJoin = isRoomPath(location.pathname);

  useEffect(() => {
    if (!loading && !user && !isGuest && roomJoin) {
      signInAsGuest();
    }
  }, [loading, user, isGuest, roomJoin, signInAsGuest]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!user && !isGuest) {
    if (roomJoin) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Loading…</div>
        </div>
      );
    }
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
            <Route path="room/:code" element={<Suspense fallback={<PageFallback />}><Room /></Suspense>} />
          </Route>
        </Routes>
      </FocusTimerProvider>
    </ProtectedRoute>
  );
}
