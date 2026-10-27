import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, Archive, ArrowRight, CarFront, CircleDollarSign, ClipboardList, LoaderCircle, Plus, RefreshCw, MessageSquare } from "lucide-react";
import { AccountShell } from "@/components/AccountShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { InquiryConversation } from "@/components/InquiryConversation";

type Listing = Tables<"car_listings">;
type Inquiry = Pick<Tables<"inquiries">, "id" | "listing_id" | "buyer_id" | "message" | "status" | "created_at">;

const moneyInr = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(value);

const statusVariant: Record<Listing["status"], "default" | "secondary" | "outline"> = {
  draft: "outline",
  active: "default",
  under_offer: "secondary",
  sold: "secondary",
};

export default function SellerDashboard() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryError, setInquiryError] = useState("");
  const [openInquiryId, setOpenInquiryId] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("car_listings")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    if (queryError) {
      setError("We couldn’t load your listings. Check your connection and try again.");
      setListings([]);
    } else {
      setListings(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadListings(); }, [loadListings]);

  const loadInquiries = useCallback(async () => {
    if (!user) return;
    setInquiryError("");
    const { data, error: queryError } = await supabase.from("inquiries")
      .select("id, listing_id, buyer_id, message, status, created_at")
      .eq("seller_id", user.id).order("created_at", { ascending: false });
    if (queryError) { setInquiryError("We couldn’t load your inquiries. Please try again."); setInquiries([]); }
    else setInquiries(data ?? []);
  }, [user]);

  useEffect(() => { void loadInquiries(); }, [loadInquiries]);

  const updateInquiryStatus = async (inquiry: Inquiry, status: Inquiry["status"]) => {
    const { error: updateError } = await supabase.from("inquiries").update({ status }).eq("id", inquiry.id).eq("seller_id", user?.id ?? "");
    if (updateError) setInquiryError("We couldn’t update that inquiry. Please try again.");
    else setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, status } : item));
  };

  const totals = {
    all: listings.length,
    active: listings.filter((listing) => listing.status === "active").length,
    drafts: listings.filter((listing) => listing.status === "draft").length,
    sold: listings.filter((listing) => listing.status === "sold").length,
  };

  return (
    <AccountShell title="Seller dashboard" subtitle={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ""}. Manage your car listings from here.`}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild><Link to="/seller/listings/new"><Plus className="mr-2 h-4 w-4" />Add Car</Link></Button>
        <Button asChild variant="outline"><Link to="/seller/listings"><ClipboardList className="mr-2 h-4 w-4" />My Listings</Link></Button>
      </div>

      {error && (
        <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void loadListings()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total listings" value={loading ? null : totals.all} icon={<CarFront className="h-5 w-5" />} />
        <StatCard title="Active" value={loading ? null : totals.active} icon={<Activity className="h-5 w-5" />} />
        <StatCard title="Drafts" value={loading ? null : totals.drafts} icon={<Archive className="h-5 w-5" />} />
        <StatCard title="Sold" value={loading ? null : totals.sold} icon={<CircleDollarSign className="h-5 w-5" />} />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div><CardTitle>Recent listings</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your latest cars and their current status.</p></div>
          <Button variant="ghost" size="sm" onClick={() => void loadListings()} disabled={loading} aria-label="Refresh listings"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" />Loading your listings…</div>
          ) : error ? (
            <p className="py-6 text-sm text-muted-foreground">Your listing summary is unavailable right now.</p>
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <CarFront className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <h2 className="font-semibold">Your first listing starts here</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Add your car details, photos and asking price. You can save a draft before publishing.</p>
              <Button asChild className="mt-4"><Link to="/seller/listings/new"><Plus className="mr-2 h-4 w-4" />Add Car</Link></Button>
            </div>
          ) : (
            <div className="divide-y">
              {listings.slice(0, 5).map((listing) => (
                <div key={listing.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{listing.manufacturing_year} {listing.brand} {listing.model}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{listing.city} · {moneyInr(listing.asking_price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariant[listing.status]} className="capitalize">{listing.status.replace("_", " ")}</Badge>
                    <Button asChild variant="ghost" size="sm"><Link to="/seller/listings">Manage<ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                  </div>
                </div>
              ))}
              {listings.length > 5 && <div className="pt-4"><Button asChild variant="outline"><Link to="/seller/listings">View all {listings.length} listings<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div><CardTitle>Buyer inquiries</CardTitle><p className="mt-1 text-sm text-muted-foreground">Messages for your listings. Buyer contact details stay private.</p></div>
          <Button variant="ghost" size="sm" onClick={() => void loadInquiries()} aria-label="Refresh inquiries"><RefreshCw className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          {inquiryError ? <p role="alert" className="py-4 text-sm text-destructive">{inquiryError}</p> : inquiries.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground"><MessageSquare className="h-5 w-5" />No inquiries yet.</div>
          ) : <div className="divide-y">{inquiries.map((inquiry) => {
            const car = listings.find((item) => item.id === inquiry.listing_id);
            return <article key={inquiry.id} className="space-y-3 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{car ? `${car.manufacturing_year} ${car.brand} ${car.model}` : "Your listing"}</p><p className="text-xs text-muted-foreground">{new Date(inquiry.created_at).toLocaleString()}</p></div>
                <select aria-label={`Inquiry status for ${car ? `${car.brand} ${car.model}` : "listing"}`} value={inquiry.status} onChange={(event) => void updateInquiryStatus(inquiry, event.target.value as Inquiry["status"])} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="pending">New</option><option value="contacted">Contacted</option><option value="negotiating">Negotiating</option><option value="closed">Closed</option></select>
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm leading-6">{inquiry.message}</p>
              <Button variant="outline" size="sm" onClick={() => setOpenInquiryId(openInquiryId === inquiry.id ? null : inquiry.id)}>
                <MessageSquare className="mr-2 h-4 w-4" />{openInquiryId === inquiry.id ? "Hide conversation" : "Reply"}
              </Button>
              {openInquiryId === inquiry.id && user && <InquiryConversation inquiryId={inquiry.id} initialMessage={inquiry.message} initialCreatedAt={inquiry.created_at} buyerId={inquiry.buyer_id} userId={user.id} otherParticipantLabel="Buyer" />}
            </article>;
          })}</div>}
        </CardContent>
      </Card>
    </AccountShell>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | null; icon: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><span className="text-primary">{icon}</span></CardHeader>
      <CardContent>{value === null ? <div className="h-8 w-12 animate-pulse rounded bg-muted" /> : <p className="text-3xl font-bold">{value}</p>}</CardContent>
    </Card>
  );
}
