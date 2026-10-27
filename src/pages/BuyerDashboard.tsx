import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, LoaderCircle, MessageSquare, RefreshCw, Search, Sparkles } from "lucide-react";
import { AccountShell } from "@/components/AccountShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { InquiryConversation } from "@/components/InquiryConversation";

type Inquiry = Pick<Tables<"inquiries">, "id" | "listing_id" | "buyer_id" | "message" | "status" | "created_at">;
type Car = Pick<Tables<"car_listings">, "id" | "brand" | "model" | "manufacturing_year" | "city">;

export default function BuyerDashboard() {
  const { profile, user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [cars, setCars] = useState<Record<string, Car>>({});
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [inquiryError, setInquiryError] = useState("");
  const [openInquiryId, setOpenInquiryId] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    if (!user) return;
    setLoadingInquiries(true);
    setInquiryError("");
    const { data, error } = await supabase.from("inquiries")
      .select("id, listing_id, buyer_id, message, status, created_at")
      .eq("buyer_id", user.id).order("created_at", { ascending: false });
    if (error) { setInquiryError("Your inquiries couldn’t be loaded. Try again."); setInquiries([]); setLoadingInquiries(false); return; }
    const rows = data ?? [];
    setInquiries(rows);
    if (rows.length) {
      const { data: listingData } = await supabase.from("car_listings")
        .select("id, brand, model, manufacturing_year, city")
        .in("id", [...new Set(rows.map((inquiry) => inquiry.listing_id))]);
      setCars(Object.fromEntries((listingData ?? []).map((car) => [car.id, car])));
    } else setCars({});
    setLoadingInquiries(false);
  }, [user]);

  useEffect(() => { void loadInquiries(); }, [loadInquiries]);
  return (
    <AccountShell title={`Hello${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`} subtitle="Your AutoValuator buyer account at a glance.">
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader><div className="mb-2 w-fit rounded-xl bg-primary/10 p-3 text-primary"><Search className="h-6 w-6" /></div><CardTitle>Find your next car</CardTitle></CardHeader>
          <CardContent><p className="mb-5 text-sm leading-6 text-muted-foreground">Browse published cars from AutoValuator sellers, then use the estimator to compare an asking price with an estimated resale value.</p><div className="flex flex-wrap gap-2"><Button asChild><Link to="/marketplace">Browse Cars<ArrowRight className="ml-1 h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link to="/">Open price estimator</Link></Button></div></CardContent>
        </Card>
        <Card><CardHeader><div className="mb-2 w-fit rounded-xl bg-rose-500/10 p-3 text-rose-600"><Heart className="h-6 w-6" /></div><CardTitle>Saved cars</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Your favorites will appear here when marketplace listings are available.</p></CardContent></Card>
        <Card className="md:col-span-2"><CardHeader className="flex flex-row items-center justify-between gap-3"><div><div className="mb-2 w-fit rounded-xl bg-primary/10 p-3 text-primary"><MessageSquare className="h-6 w-6" /></div><CardTitle>My inquiries</CardTitle><p className="mt-1 text-sm text-muted-foreground">Continue conversations with sellers about cars you contacted.</p></div><Button variant="ghost" size="sm" onClick={() => void loadInquiries()} disabled={loadingInquiries} aria-label="Refresh inquiries"><RefreshCw className={`h-4 w-4 ${loadingInquiries ? "animate-spin" : ""}`} /></Button></CardHeader>
          <CardContent>{loadingInquiries ? <div className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Loading your inquiries…</div>
            : inquiryError ? <p role="alert" className="text-sm text-destructive">{inquiryError}</p>
              : inquiries.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">You haven’t contacted a seller yet. Browse cars to get started.</p>
                : <div className="divide-y">{inquiries.map((inquiry) => {
                  const car = cars[inquiry.listing_id];
                  return <article key={inquiry.id} className="space-y-3 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{car ? `${car.manufacturing_year} ${car.brand} ${car.model}` : "Car listing"}</p><p className="text-xs text-muted-foreground">{car?.city ?? "Listing no longer public"} · {new Date(inquiry.created_at).toLocaleDateString()}</p></div><Button variant="outline" size="sm" onClick={() => setOpenInquiryId(openInquiryId === inquiry.id ? null : inquiry.id)}><MessageSquare className="mr-2 h-4 w-4" />{openInquiryId === inquiry.id ? "Hide conversation" : "Open conversation"}</Button></div>
                    <p className="text-xs text-muted-foreground">Status: <span className="capitalize">{inquiry.status}</span></p>
                    {openInquiryId === inquiry.id && user && <InquiryConversation inquiryId={inquiry.id} initialMessage={inquiry.message} initialCreatedAt={inquiry.created_at} buyerId={inquiry.buyer_id} userId={user.id} otherParticipantLabel="Seller" />}
                  </article>;
                })}</div>}
        </CardContent></Card>
        <Card className="md:col-span-2"><CardHeader><div className="mb-2 w-fit rounded-xl bg-amber-500/10 p-3 text-amber-600"><Sparkles className="h-6 w-6" /></div><CardTitle>Account ready</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Signed in as {user?.email}. Manage your contact details and request seller access from your account page.</p><Button asChild variant="outline" className="mt-4"><Link to="/account">Manage account</Link></Button></CardContent></Card>
      </div>
    </AccountShell>
  );
}
