import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Archive, ArrowLeft, CheckCircle2, Clock3, Image as ImageIcon, LoaderCircle, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/AccountShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { removeListingImages } from "@/lib/listingImages";
import { formatInr, getListingPriceComparison, getPriceComparisonDescription } from "@/lib/priceComparison";

type Listing = Tables<"car_listings">;

const moneyInr = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(value);

const statusStyle: Record<Listing["status"], string> = {
  draft: "border-muted-foreground/30 bg-muted text-muted-foreground",
  active: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  under_offer: "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  sold: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

export default function SellerListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const priceComparisons = useMemo(() => new Map(
    listings.map((listing) => [listing.id, getListingPriceComparison(listing)]),
  ), [listings]);

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
      setError("We couldn’t load your listings. Please try again.");
      setListings([]);
    } else {
      setListings(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadListings(); }, [loadListings]);

  const changeStatus = async (listing: Listing, status: "active" | "sold") => {
    if (status === "active" && listing.image_urls.length === 0) {
      toast.error("Add at least one photo before publishing this draft.");
      return;
    }
    setBusyId(listing.id);
    const { error: updateError } = await supabase
      .from("car_listings")
      .update({ status })
      .eq("id", listing.id)
      .select("id")
      .single();
    setBusyId(null);
    if (updateError) {
      toast.error("Could not update this listing. Check your seller access and try again.");
      return;
    }
    toast.success(status === "active" ? "Your car is published and visible in Browse Cars." : "This car is marked as sold.");
    await loadListings();
  };

  const deleteListing = async () => {
    if (!deleteTarget || !user) return;
    const target = deleteTarget;
    setBusyId(target.id);
    const { error: deleteError } = await supabase
      .from("car_listings")
      .delete()
      .eq("id", target.id)
      .select("id")
      .single();
    setBusyId(null);
    if (deleteError) {
      toast.error("Could not delete this listing. Please try again.");
      return;
    }

    setDeleteTarget(null);
    setListings((current) => current.filter((listing) => listing.id !== target.id));
    try {
      await removeListingImages(user.id, target.image_urls);
      toast.success("Listing deleted.");
    } catch {
      toast.warning("Listing deleted, but one or more photos could not be removed from Storage.");
    }
  };

  return (
    <AccountShell title="My listings" subtitle="Manage your drafts, active cars and completed sales.">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost"><Link to="/seller/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Seller dashboard</Link></Button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => void loadListings()} disabled={loading} aria-label="Refresh listings"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
          <Button asChild><Link to="/seller/listings/new"><Plus className="mr-2 h-4 w-4" />Add Car</Link></Button>
        </div>
      </div>

      {error && <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" />Loading your cars…</div>
      ) : error ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><p className="text-sm text-muted-foreground">Your listing data could not be loaded.</p><Button variant="outline" onClick={() => void loadListings()}>Try again</Button></CardContent></Card>
      ) : listings.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-14 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary"><Archive className="h-7 w-7" /></div>
          <h2 className="text-lg font-semibold">No listings yet</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">Add your first car, calculate its AI estimate and save it as a draft or publish it.</p>
          <Button asChild className="mt-5"><Link to="/seller/listings/new"><Plus className="mr-2 h-4 w-4" />Add Car</Link></Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="h-28 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40">
                  {listing.image_urls[0] ? <img src={listing.image_urls[0]} alt={`${listing.brand} ${listing.model}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">{listing.manufacturing_year} {listing.brand} {listing.model}</h2>
                    <Badge variant="outline" className={`capitalize ${statusStyle[listing.status]}`}>{listing.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{listing.city} · {listing.kilometers_driven.toLocaleString("en-IN")} km · {listing.number_of_owners} owner{listing.number_of_owners === 1 ? "" : "s"}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <span><span className="text-muted-foreground">Asking: </span><strong>{moneyInr(listing.asking_price)}</strong></span>
                    {(() => {
                      const comparison = priceComparisons.get(listing.id);
                      return comparison
                        ? <span className="basis-full text-xs text-muted-foreground">AI estimate {formatInr(comparison.estimatedPrice)} · {getPriceComparisonDescription(comparison)}</span>
                        : <span className="basis-full text-xs text-muted-foreground">Price estimate unavailable</span>;
                    })()}
                    <span className="text-muted-foreground">{listing.image_urls.length} photo{listing.image_urls.length === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button asChild variant="outline" size="sm"><Link to={`/seller/listings/${listing.id}/edit`}><Pencil className="mr-1.5 h-4 w-4" />Edit</Link></Button>
                  {listing.status === "draft" && <Button size="sm" onClick={() => void changeStatus(listing, "active")} disabled={busyId === listing.id}>{busyId === listing.id ? <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}Publish</Button>}
                  {(listing.status === "active" || listing.status === "under_offer") && <Button variant="secondary" size="sm" onClick={() => void changeStatus(listing, "sold")} disabled={busyId === listing.id}>{busyId === listing.id ? <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" /> : <Clock3 className="mr-1.5 h-4 w-4" />}Mark sold</Button>}
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(listing)} disabled={busyId === listing.id}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !busyId) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this listing?</AlertDialogTitle><AlertDialogDescription>This removes the listing and its photos from the marketplace. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(busyId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={Boolean(busyId)} onClick={(event) => { event.preventDefault(); void deleteListing(); }}>{busyId ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Delete listing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccountShell>
  );
}
