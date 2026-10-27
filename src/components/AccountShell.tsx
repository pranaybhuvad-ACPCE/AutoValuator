import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Car } from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function AccountShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { profile } = useAuth();
  const mode = profile?.account_mode ?? "buyer";
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold"><span className="rounded-lg bg-primary p-2 text-primary-foreground"><Car className="h-5 w-5" /></span><span>AutoValuator</span></Link>
          <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto sm:order-2 sm:w-auto">
            {(mode === "buyer" || mode === "both") && <Button asChild variant="ghost" size="sm"><Link to="/buyer/dashboard">Buyer home</Link></Button>}
            {(mode === "seller" || mode === "both") && <Button asChild variant="ghost" size="sm"><Link to="/seller/dashboard">Seller home</Link></Button>}
            <Button asChild variant="ghost" size="sm"><Link to="/">Price estimator</Link></Button>
          </nav>
          <div className="order-2 sm:order-3"><AuthNavigation /></div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7 space-y-1"><h1 className="text-3xl font-bold tracking-tight">{title}</h1><p className="text-muted-foreground">{subtitle}</p></div>
        {children}
      </main>
    </div>
  );
}
