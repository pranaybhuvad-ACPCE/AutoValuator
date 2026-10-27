import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage, useAuth } from "@/contexts/AuthContext";

export default function ResetPassword() {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirmPassword) return setError("Those passwords do not match.");
    setSubmitting(true);
    try { await updatePassword(password); setUpdated(true); }
    catch (reason) { setError(getAuthErrorMessage(reason)); }
    finally { setSubmitting(false); }
  };

  if (loading) return <AuthLayout title="Loading reset link" description="Checking your secure password reset session."><div className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Please wait…</div></AuthLayout>;
  if (!user) return <AuthLayout title="Reset link expired" description="For your security, password reset links can only be used once."><div className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">Request another link and open it in the same browser.</p><Button asChild className="w-full"><Link to="/forgot-password">Request a new reset link</Link></Button></div></AuthLayout>;
  if (updated) return <AuthLayout title="Password updated" description="Your new password is ready to use."><Button className="w-full" onClick={() => navigate("/account", { replace: true })}>Continue to account</Button></AuthLayout>;
  return (
    <AuthLayout title="Choose a new password" description="Use a password you haven’t used for another account.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <div className="space-y-2"><Label htmlFor="password">New password</Label><div className="relative"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="password" type="password" autoComplete="new-password" minLength={8} required autoFocus value={password} onChange={e => setPassword(e.target.value)} className="pl-10" /></div></div>
        <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div>
        <Button type="submit" className="h-11 w-full" disabled={submitting}>{submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{submitting ? "Updating password…" : "Save new password"}</Button>
      </form>
    </AuthLayout>
  );
}
