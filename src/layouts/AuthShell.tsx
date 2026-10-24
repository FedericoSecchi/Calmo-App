import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAProvider } from "@/components/PWAProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

// Wrapper for every route that needs auth / supabase / app providers.
// Lazy-loaded from App.tsx so the landing and SEO pages don't pull supabase,
// framer-motion-heavy providers, or the install-prompt code.
export default function AuthShell() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <PWAProvider>
          <Outlet />
        </PWAProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
