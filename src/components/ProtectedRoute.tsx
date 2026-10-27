import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, mode }: { children: ReactNode; mode?: "buyer" | "seller" }) {
  const { user, profile, loading, profileUnavailable } = useAuth();
  const location = useLocation();
  if (loading) return <main className="flex min-h-screen items-center justify-center bg-background"><div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" />Restoring your account…</div></main>;
  if (!user) return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (profileUnavailable) return <Navigate to="/account?setup=required" replace />;

  const accountMode = profile?.account_mode ?? "buyer";
  if (mode === "seller" && accountMode !== "seller" && accountMode !== "both") {
    return <Navigate to="/buyer/dashboard" replace />;
  }
  if (mode === "buyer" && accountMode === "seller") return <Navigate to="/seller/dashboard" replace />;
  return <>{children}</>;
}
