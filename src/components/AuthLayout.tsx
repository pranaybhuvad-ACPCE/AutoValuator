import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Car, ShieldCheck, Sparkles } from "lucide-react";

export function AuthLayout({ title, description, children, footer }: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid min-h-[min(780px,calc(100vh-3rem))] max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-orange-600 to-amber-500 p-10 text-white lg:flex">
          <div className="absolute -right-28 -top-20 h-80 w-80 rounded-full border-[36px] border-white/10" />
          <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full border-[48px] border-white/10" />
          <Link to="/" className="relative z-10 flex items-center gap-3 font-semibold">
            <span className="rounded-xl bg-white/15 p-2.5"><Car className="h-6 w-6" /></span>
            <span>AutoValuator</span>
          </Link>
          <div className="relative z-10 max-w-sm space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm">
              <Sparkles className="h-4 w-4" /> Your next drive starts here
            </span>
            <h2 className="text-4xl font-bold leading-tight">A smarter way to buy and sell used cars.</h2>
            <p className="text-white/85">Get a clear price estimate, explore your options, and manage your AutoValuator account in one place.</p>
          </div>
          <p className="relative z-10 flex items-center gap-2 text-sm text-white/80">
            <ShieldCheck className="h-4 w-4" /> Your account is protected by Supabase Auth
          </p>
        </aside>

        <section className="flex items-center justify-center p-5 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 font-bold text-foreground lg:hidden">
              <span className="rounded-lg bg-primary p-2 text-primary-foreground"><Car className="h-5 w-5" /></span>
              AutoValuator
            </Link>
            <div className="mb-7 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Welcome to AutoValuator</p>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </section>
      </div>
    </main>
  );
}
