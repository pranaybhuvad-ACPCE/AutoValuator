import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CarFront, CircleUserRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function AuthNavigation() {
  const { user, profile, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch {
      toast.error("We couldn’t sign you out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) return <span className="hidden text-xs text-muted-foreground sm:block">Checking account…</span>;
  if (!user) return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm"><Link to="/marketplace"><CarFront className="mr-1.5 h-4 w-4" />Browse Cars</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link to="/login">Log in</Link></Button>
      <Button asChild size="sm"><Link to="/signup">Create account</Link></Button>
    </div>
  );

  const name = profile?.full_name || user.email || "Your account";
  const mode = profile?.account_mode ?? "buyer";
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3"><Link to="/marketplace"><CarFront className="mr-1.5 h-4 w-4" />Browse Cars</Link></Button>
      {(mode === "buyer" || mode === "both") && <Button asChild variant="ghost" size="sm" className="hidden px-2 sm:inline-flex"><Link to="/buyer/dashboard">Buyer</Link></Button>}
      {(mode === "seller" || mode === "both") && <Button asChild variant="ghost" size="sm" className="hidden px-2 sm:inline-flex"><Link to="/seller/dashboard">Seller</Link></Button>}
      <Button asChild variant="ghost" size="sm" className="max-w-44 px-2 sm:px-3">
        <Link to="/account" title={name}>
          <CircleUserRound className="h-4 w-4 shrink-0" />
          <span className="max-w-28 truncate">{profile?.full_name || "Account"}</span>
        </Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={() => void handleSignOut()} disabled={signingOut}>
        <LogOut className="h-4 w-4" /><span className="hidden sm:inline">{signingOut ? "Signing out…" : "Log out"}</span>
      </Button>
    </div>
  );
}
