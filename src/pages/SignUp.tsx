import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CarFront, LoaderCircle, LockKeyhole, Mail, Store, UserRound } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type SignupAccountType = "buyer" | "seller";

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedPath = params.get("returnTo");
  const safeReturnTo = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : null;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<SignupAccountType | "">("");
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (fullName.trim().length > 120) return setError("Your name must be 120 characters or fewer.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (!accountType) return setError("Choose whether you are joining as a buyer or seller.");
    setSubmitting(true);
    try {
      const result = await signUp(fullName, email.trim(), password, accountType, safeReturnTo ?? undefined);
      if (result.confirmationRequired) setConfirmationRequired(true);
      else {
        toast.success(accountType === "seller" ? "Seller account created. You can manage car listings now." : "Your Buyer account is ready.");
        navigate(safeReturnTo || (accountType === "seller" ? "/seller/dashboard" : "/buyer/dashboard"), { replace: true });
      }
    } catch (reason) {
      setError(getAuthErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationRequired) return (
    <AuthLayout title="Check your inbox" description="One quick step before your account is ready.">
      <div className="space-y-4 rounded-xl border bg-muted/30 p-5">
        <p className="text-sm leading-6 text-muted-foreground">We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Confirm your email before signing in. Your selected {accountType === "seller" ? "Seller" : "Buyer"} account type is saved. {accountType === "seller" ? "After confirmation, sign in to manage your car listings." : "Your account type cannot be changed after registration."}</p>
        <Button asChild className="w-full"><Link to={safeReturnTo ? `/login?returnTo=${encodeURIComponent(safeReturnTo)}` : "/login"}>Go to sign in</Link></Button>
      </div>
    </AuthLayout>
  );

  return (
    <AuthLayout title="Create your account" description="Join AutoValuator and keep your car journey in one place."
      footer={<>Already have an account? <Link className="font-semibold text-primary hover:underline" to={safeReturnTo ? `/login?returnTo=${encodeURIComponent(safeReturnTo)}` : "/login"}>Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <div className="space-y-2"><Label htmlFor="full-name">Full name</Label><div className="relative"><UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="full-name" autoComplete="name" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="pl-10" /></div></div>
        <div className="space-y-2"><Label htmlFor="email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" /></div></div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="pl-10" /></div><p className="text-xs text-muted-foreground">Use at least 8 characters.</p></div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">How will you use AutoValuator?</legend>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
            <label htmlFor="account-type-buyer" className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${accountType === "buyer" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
              <input id="account-type-buyer" type="radio" name="account-type" value="buyer" className="mt-1 accent-primary" checked={accountType === "buyer"} onChange={() => setAccountType("buyer")} />
              <CarFront className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span><span className="block text-sm font-semibold">Buyer</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Browse cars, save favorites and contact sellers.</span></span>
            </label>
            <label htmlFor="account-type-seller" className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${accountType === "seller" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
              <input id="account-type-seller" type="radio" name="account-type" value="seller" className="mt-1 accent-primary" checked={accountType === "seller"} onChange={() => setAccountType("seller")} />
              <Store className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span><span className="block text-sm font-semibold">Seller</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Create and manage your car listings after registration.</span></span>
            </label>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Your selected account type is permanent. Seller accounts can manage listings as soon as registration is complete.</p>
        </fieldset>
        <Button className="h-11 w-full" type="submit" disabled={submitting}>{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{submitting ? "Creating account…" : "Create account"}</Button>
      </form>
    </AuthLayout>
  );
}
