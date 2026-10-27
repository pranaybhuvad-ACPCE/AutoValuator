import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage, useAuth } from "@/contexts/AuthContext";

export function getDashboardPath(mode?: string | null) {
  return mode === "seller" || mode === "both" ? "/seller/dashboard" : "/buyer/dashboard";
}

export default function Login() {
  const { signIn } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setSubmitting(true);
    try {
      const signedInProfile = await signIn(cleanEmail, password);
      const requestedPath = params.get("returnTo");
      const safePath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : null;
      navigate(safePath || getDashboardPath(signedInProfile?.account_mode), { replace: true });
    } catch (reason) {
      setError(getAuthErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" description="Sign in to continue to your AutoValuator account."
      footer={<>New to AutoValuator? <Link className="font-semibold text-primary hover:underline" to={params.get("returnTo") ? `/signup?returnTo=${encodeURIComponent(params.get("returnTo")!)}` : "/signup"}>Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" autoFocus required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link></div>
          <div className="relative"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="pl-10" />
          </div>
        </div>
        <Button className="h-11 w-full" type="submit" disabled={submitting}>
          {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Button asChild variant="ghost" className="mt-3 w-full"><Link to="/">Back to price estimator</Link></Button>
    </AuthLayout>
  );
}
