import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LoaderCircle, Mail } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage, useAuth } from "@/contexts/AuthContext";

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    setSubmitting(true);
    try { await sendPasswordReset(email.trim()); setSent(true); }
    catch (reason) { setError(getAuthErrorMessage(reason)); }
    finally { setSubmitting(false); }
  };
  return (
    <AuthLayout title={sent ? "Check your inbox" : "Reset your password"} description={sent ? "If that address has an account, a reset link is on its way." : "Enter the email you used to create your account and we’ll send you a reset link."} footer={<>Remembered it? <Link className="font-semibold text-primary hover:underline" to="/login">Back to sign in</Link></>}>
      {sent ? <div className="space-y-4 rounded-xl border bg-muted/30 p-5"><p className="text-sm leading-6 text-muted-foreground">Open the password reset email and follow its link. You’ll return here to choose a new password.</p><Button asChild variant="outline" className="w-full"><Link to="/login">Return to sign in</Link></Button></div> :
        <form onSubmit={submit} className="space-y-5" noValidate>
          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <div className="space-y-2"><Label htmlFor="email">Email address</Label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="email" type="email" autoComplete="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" /></div></div>
          <Button type="submit" className="h-11 w-full" disabled={submitting}>{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{submitting ? "Sending link…" : "Send reset link"}</Button>
        </form>}
    </AuthLayout>
  );
}
