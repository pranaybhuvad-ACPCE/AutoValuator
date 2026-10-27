import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { AccountShell } from "@/components/AccountShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage, useAuth } from "@/contexts/AuthContext";
import { normalizeIndianMobile } from "@/lib/indianMobile";

export default function Account() {
  const { user, profile, profileUnavailable, saveProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [publicDisplayName, setPublicDisplayName] = useState(profile?.public_display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setPublicDisplayName(profile?.public_display_name ?? "");
  }, [profile]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage("");
    if (fullName.trim().length < 2 || fullName.trim().length > 120) return setError("Name must be between 2 and 120 characters.");
    if (phone.length > 32) return setError("Phone number must be 32 characters or fewer.");
    const normalizedPhone = isSellerType && phone.trim() ? normalizeIndianMobile(phone) : null;
    if (isSellerType && phone.trim() && !normalizedPhone) return setError("Enter a valid Indian mobile number, such as 9876543210 or +91 9876543210.");
    if (publicDisplayName.trim().length > 80) return setError("Public display name must be 80 characters or fewer.");
    setSaving(true);
    try { await saveProfile(fullName, isSellerType ? normalizedPhone ?? "" : phone, isSellerType ? publicDisplayName : undefined); setMessage("Your account details were updated."); }
    catch (reason) { setError(getAuthErrorMessage(reason)); }
    finally { setSaving(false); }
  };

  const mode = profile?.account_mode ?? "buyer";
  const isSellerType = mode === "seller" || mode === "both";

  return (
    <AccountShell title="Account settings" subtitle="Update your profile and view your AutoValuator account access.">
      {profileUnavailable && <div role="alert" className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">Your Supabase profile could not be loaded. Apply the marketplace migrations, then sign out and back in.</div>}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><div className="mb-2 w-fit rounded-xl bg-primary/10 p-3 text-primary"><UserRound className="h-6 w-6" /></div><CardTitle>Personal details</CardTitle><CardDescription>Your email is managed by Supabase Auth.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="account-name">Full name</Label><Input id="account-name" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} disabled={profileUnavailable} /></div>
              <div className="space-y-2"><Label htmlFor="account-email">Email</Label><Input id="account-email" type="email" value={user?.email ?? ""} disabled /></div>
              <div className="space-y-2"><Label htmlFor="account-phone">{isSellerType ? "Indian mobile number" : "Phone"} <span className="font-normal text-muted-foreground">({isSellerType ? "required to publish listings" : "optional"})</span></Label><Input id="account-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={isSellerType ? "+91 9876543210" : "Your contact number"} disabled={profileUnavailable} /><p className="text-xs leading-5 text-muted-foreground">{isSellerType ? "Use a valid Indian mobile number. This contact number is kept private and is not shown on marketplace listings." : "Your contact details remain private."}</p></div>
              {isSellerType && <div className="space-y-2"><Label htmlFor="seller-public-name">Public Seller display name <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="seller-public-name" autoComplete="nickname" maxLength={80} value={publicDisplayName} onChange={e => setPublicDisplayName(e.target.value)} placeholder="Name shown on your active listings" disabled={profileUnavailable} /><p className="text-xs leading-5 text-muted-foreground">Only this name is shown on your active marketplace listings. Leave blank to keep your Seller name private.</p></div>}
              {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
              {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">{message}</p>}
              <Button type="submit" disabled={saving || profileUnavailable}>{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "Saving…" : "Save details"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="mb-2 w-fit rounded-xl bg-sky-500/10 p-3 text-sky-700"><ShieldCheck className="h-6 w-6" /></div><CardTitle>Account type</CardTitle><CardDescription>Your selected account type is permanent.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm text-muted-foreground">Registered as</span><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold capitalize text-primary">{mode}</span></div>
            {isSellerType && <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200"><p>Your Seller account can manage listings. <Link className="font-semibold underline" to="/seller/dashboard">Open seller dashboard</Link></p></div>}
            {mode === "buyer" && <p className="rounded-lg bg-muted p-3 text-sm leading-5 text-muted-foreground">Buyer accounts can use the estimator and buyer features. To register as a Seller, create a new account with a different email address.</p>}
          </CardContent>
        </Card>
      </div>
    </AccountShell>
  );
}
