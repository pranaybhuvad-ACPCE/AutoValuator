import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { ArrowDownAZ, ArrowLeft, ArrowUpDown, CarFront, ChevronDown, ChevronUp, Fuel, Gauge, Heart, LoaderCircle, MapPin, Search, Settings2, SlidersHorizontal, X } from "lucide-react";
import { AuthNavigation } from "@/components/AuthNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { formatInr, formatPercentage, getListingPriceComparison, getPriceComparisonDescription, type PriceComparison } from "@/lib/priceComparison";

const PUBLIC_LISTING_COLUMNS = "id, brand, model, manufacturing_year, fuel_type, transmission, kilometers_driven, number_of_owners, description, city, asking_price, estimated_price, image_urls, created_at" as const;
type PublicListing = Pick<Tables<"car_listings">,
  | "id"
  | "brand"
  | "model"
  | "manufacturing_year"
  | "fuel_type"
  | "transmission"
  | "kilometers_driven"
  | "number_of_owners"
  | "description"
  | "city"
  | "asking_price"
  | "estimated_price"
  | "image_urls"
  | "created_at"
>;

type ListingSort = "newest" | "oldest" | "price-low" | "price-high";

export default function Marketplace() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const location = useLocation();
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [fuelFilter, setFuelFilter] = useState("");
  const [transmissionFilter, setTransmissionFilter] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sort, setSort] = useState<ListingSort>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const priceComparisons = useMemo(() => Object.fromEntries(
    listings.map((car) => [car.id, getListingPriceComparison(car)]),
  ), [listings]);
  const activeFilterCount = [search.trim(), minPrice, maxPrice, fuelFilter, transmissionFilter, minYear, maxYear, locationFilter.trim()]
    .filter((value) => value !== "").length;

  const availableFuelTypes = useMemo(() => [...new Set(listings.map((car) => car.fuel_type).filter(Boolean))].sort(), [listings]);
  const availableTransmissions = useMemo(() => [...new Set(listings.map((car) => car.transmission).filter(Boolean))].sort(), [listings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const cityQuery = locationFilter.trim().toLocaleLowerCase();
    const minPriceValue = minPrice === "" ? null : Number(minPrice);
    const maxPriceValue = maxPrice === "" ? null : Number(maxPrice);
    const minYearValue = minYear === "" ? null : Number(minYear);
    const maxYearValue = maxYear === "" ? null : Number(maxYear);
    const results = listings.filter((car) => {
      const matchesText = !query || `${car.brand} ${car.model}`.toLocaleLowerCase().includes(query);
      return matchesText
        && (minPriceValue === null || car.asking_price >= minPriceValue)
        && (maxPriceValue === null || car.asking_price <= maxPriceValue)
        && (!fuelFilter || car.fuel_type === fuelFilter)
        && (!transmissionFilter || car.transmission === transmissionFilter)
        && (minYearValue === null || car.manufacturing_year >= minYearValue)
        && (maxYearValue === null || car.manufacturing_year <= maxYearValue)
        && (!cityQuery || car.city.toLocaleLowerCase().includes(cityQuery));
    });

    return results.sort((a, b) => {
      if (sort === "price-low") return a.asking_price - b.asking_price;
      if (sort === "price-high") return b.asking_price - a.asking_price;
      const dateDifference = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "oldest" ? dateDifference : -dateDifference;
    });
  }, [listings, search, minPrice, maxPrice, fuelFilter, transmissionFilter, minYear, maxYear, locationFilter, sort]);

  const clearFilters = () => {
    setSearch(""); setMinPrice(""); setMaxPrice(""); setFuelFilter("");
    setTransmissionFilter(""); setMinYear(""); setMaxYear("");
    setLocationFilter(""); setSort("newest");
  };

  useEffect(() => {
    let cancelled = false;
    const loadFavorite = async () => {
      if (!user || !id || !["buyer", "both"].includes(profile?.account_mode ?? "")) { setFavorite(false); return; }
      const { data } = await supabase.from("favorites").select("id").eq("listing_id", id).eq("buyer_id", user.id).maybeSingle();
      if (!cancelled) setFavorite(Boolean(data));
    };
    void loadFavorite();
    return () => { cancelled = true; };
  }, [id, user, profile?.account_mode]);

  const toggleFavorite = async () => {
    if (!user) { window.location.assign(`/login?returnTo=${encodeURIComponent(location.pathname)}`); return; }
    if (!["buyer", "both"].includes(profile?.account_mode ?? "")) { toast.error("Favorites are available to Buyer accounts."); return; }
    setSaving(true);
    const result = favorite
      ? await supabase.from("favorites").delete().eq("listing_id", id!).eq("buyer_id", user.id)
      : await supabase.from("favorites").insert({ listing_id: id!, buyer_id: user.id });
    setSaving(false);
    if (result.error) toast.error("We couldn’t update your favorites. Please try again.");
    else { setFavorite(!favorite); toast.success(favorite ? "Removed from favorites" : "Added to favorites"); }
  };

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!user) { window.location.assign(`/login?returnTo=${encodeURIComponent(location.pathname)}`); return; }
    if (!["buyer", "both"].includes(profile?.account_mode ?? "")) { toast.error("Only Buyer accounts can contact sellers."); return; }
    if (cleanMessage.length < 1 || cleanMessage.length > 5000) { toast.error("Message must be between 1 and 5,000 characters."); return; }
    setSaving(true);
    const { error: insertError } = await supabase.from("inquiries").insert({ listing_id: id!, message: cleanMessage });
    setSaving(false);
    if (insertError) toast.error(insertError.message.includes("Cannot inquire") ? "You can’t inquire about your own listing." : "We couldn’t send your inquiry. Please try again.");
    else { setMessage(""); toast.success("Your inquiry was sent to the seller."); }
  };

  useEffect(() => {
    let cancelled = false;

    const loadListings = async (quiet = false) => {
      if (!quiet) setLoading(true);
      setError("");

      if (id) {
        const { data, error: queryError } = await supabase
          .from("car_listings")
          .select(PUBLIC_LISTING_COLUMNS)
          .eq("id", id)
          .eq("status", "active")
          .maybeSingle();

        if (cancelled) return;
        if (queryError) {
          setError("We couldn’t load this car. Please try again.");
          setListings([]);
        } else {
          setListings(data ? [data] : []);
        }
      } else {
        const { data, error: queryError } = await supabase
          .from("car_listings")
          .select(PUBLIC_LISTING_COLUMNS)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (queryError) {
          setError("We couldn’t load published cars. Check the connection and try again.");
          setListings([]);
        } else {
          const activeListings = data ?? [];
          setListings(activeListings);
          if (activeListings.length === 0) setSellerNames({});
          else {
            const { data: names } = await supabase.rpc("get_public_listing_seller_names", {
              listing_ids: activeListings.map((car) => car.id),
            });
            if (cancelled) return;
            setSellerNames(Object.fromEntries((names ?? []).map((item) => [item.listing_id, item.public_display_name])));
          }
        }
      }

      if (!quiet) setLoading(false);
    };

    void loadListings();
    // Refresh the public list periodically so a newly published car appears
    // without asking buyers to reload the page. This does not require Realtime setup.
    const refreshTimer = window.setInterval(() => void loadListings(true), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [id]);

  const listing = listings[0];
  const listingPriceComparison = listing ? priceComparisons[listing.id] ?? null : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/marketplace" className="flex items-center gap-2 font-bold text-foreground">
            <span className="rounded-lg bg-primary p-2 text-primary-foreground"><CarFront className="h-5 w-5" /></span>
            <span>AutoValuator <span className="font-normal text-muted-foreground">· Browse Cars</span></span>
          </Link>
          <AuthNavigation />
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-8 sm:py-10">
        {id ? (
          <>
            <Button asChild variant="ghost"><Link to="/marketplace"><ArrowLeft className="mr-2 h-4 w-4" />All cars</Link></Button>
            {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : !listing ? (
              <EmptyState detail="This car is unavailable or is no longer published." />
            ) : (
              <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  {listing.image_urls.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {listing.image_urls.map((url, index) => (
                        <img key={`${url}-${index}`} src={url} alt={`${listing.brand} ${listing.model} photo ${index + 1}`} className="aspect-[4/3] w-full rounded-xl bg-muted object-cover" />
                      ))}
                    </div>
                  ) : <PhotoFallback />}
                </div>
                <Card className="h-fit">
                  <CardContent className="space-y-5 p-5 sm:p-6">
                    <div className="space-y-2">
                      <Badge variant="secondary">Available</Badge>
                      <h1 className="text-2xl font-bold">{listing.manufacturing_year} {listing.brand} {listing.model}</h1>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{listing.city}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => void toggleFavorite()} disabled={saving} aria-pressed={favorite}><Heart className={`mr-2 h-4 w-4 ${favorite ? "fill-current text-destructive" : ""}`} />{favorite ? "Saved" : "Save"}</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Detail label="Fuel" value={listing.fuel_type} icon={<Fuel className="h-4 w-4" />} />
                      <Detail label="Transmission" value={listing.transmission} icon={<Settings2 className="h-4 w-4" />} />
                      <Detail label="Odometer" value={`${listing.kilometers_driven.toLocaleString("en-IN")} km`} icon={<Gauge className="h-4 w-4" />} />
                      <Detail label="Owners" value={`${listing.number_of_owners}`} icon={<CarFront className="h-4 w-4" />} />
                    </div>
                    <div className="space-y-2 border-t pt-4">
                      <p className="text-sm text-muted-foreground">Asking price</p>
                      <p className="text-3xl font-bold">{formatInr(listing.asking_price)}</p>
                      <PriceAssessment comparison={listingPriceComparison} />
                    </div>
                    <p className="border-t pt-3 text-xs leading-5 text-muted-foreground">AI estimate based on available vehicle details. Actual market prices may vary with condition, ownership history, location, and negotiation.</p>
                    {listing.description && <div className="space-y-2 border-t pt-4"><h2 className="font-semibold">Description</h2><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{listing.description}</p></div>}
                    <form onSubmit={submitInquiry} className="space-y-3 border-t pt-4">
                      <div><h2 className="font-semibold">Contact seller</h2><p className="text-sm text-muted-foreground">Send a message about this car. Your inquiry is shared securely with its seller.</p></div>
                      <Label htmlFor="inquiry-message">Your message</Label>
                      <Textarea id="inquiry-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={5000} required rows={4} placeholder="Hi, is this car still available?" />
                      <Button type="submit" className="w-full" disabled={saving}>{saving ? "Sending…" : "Send inquiry"}</Button>
                    </form>
                  </CardContent>
                </Card>
              </section>
            )}
          </>
        ) : (
          <>
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">AutoValuator Marketplace</p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find your next car</h1>
                <p className="max-w-2xl text-muted-foreground">Browse cars published by our sellers. Only currently active listings appear here.</p>
              </div>
              {!loading && !error && <Badge variant="outline">{filteredListings.length} matching {filteredListings.length === 1 ? "car" : "cars"}</Badge>}
            </section>

            <Button
              type="button"
              variant="outline"
              className="w-full justify-between border-primary/30 bg-card text-foreground hover:border-primary/60 hover:bg-accent/40 sm:w-auto"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="marketplace-filter-panel"
            >
              <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary" />Filters{activeFilterCount > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground" aria-label={`${activeFilterCount} active filters`}>{activeFilterCount}</span>}</span>
              {filtersOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
            </Button>

            <Card id="marketplace-filter-panel" hidden={!filtersOpen} className="border-primary/20 bg-card/80">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4 text-primary" />Search & filters</h2>
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1.5 h-4 w-4" />Clear filters</Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="relative sm:col-span-2 lg:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search brand or model" aria-label="Search by brand or model" className="pl-9" /></div>
                  <FilterSelect label="Fuel type" value={fuelFilter} onChange={setFuelFilter} options={availableFuelTypes} />
                  <FilterSelect label="Transmission" value={transmissionFilter} onChange={setTransmissionFilter} options={availableTransmissions} />
                  <NumberFilter label="Min price (₹)" value={minPrice} onChange={setMinPrice} min={0} />
                  <NumberFilter label="Max price (₹)" value={maxPrice} onChange={setMaxPrice} min={0} />
                  <NumberFilter label="Year from" value={minYear} onChange={setMinYear} min={1950} max={2100} />
                  <NumberFilter label="Year to" value={maxYear} onChange={setMaxYear} min={1950} max={2100} />
                  <Input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="City or location" aria-label="Filter by city or location" />
                  <label className="relative"><span className="sr-only">Sort listings</span><ArrowUpDown className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><select value={sort} onChange={(event) => setSort(event.target.value as ListingSort)} className="h-10 w-full appearance-none rounded-md border border-input bg-background px-9 py-2 text-sm text-foreground"><option value="newest">Newest listings</option><option value="oldest">Oldest listings</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
                </div>
                <p className="text-xs text-muted-foreground">{loading ? "Updating available cars…" : `${filteredListings.length} of ${listings.length} available ${listings.length === 1 ? "car" : "cars"} match`}</p>
              </CardContent>
            </Card>

            {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : listings.length === 0 ? (
              <EmptyState detail="There are no published cars yet. Check back soon." />
            ) : filteredListings.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><Search className="h-9 w-9 text-muted-foreground" /><h2 className="text-lg font-semibold">No matching cars</h2><p className="text-sm text-muted-foreground">Try changing or clearing your search and filters.</p><Button variant="outline" onClick={clearFilters}>Clear filters</Button></CardContent></Card>
            ) : (
              <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((car) => (
                  <Card key={car.id} className="overflow-hidden transition-shadow hover:shadow-md">
                    <Link to={`/marketplace/${car.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <div className="aspect-[16/10] bg-muted">
                        {car.image_urls[0] ? <img src={car.image_urls[0]} alt={`${car.brand} ${car.model}`} className="h-full w-full object-cover" /> : <PhotoFallback />}
                      </div>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div><h2 className="font-semibold">{car.manufacturing_year} {car.brand} {car.model}</h2><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /><span>Listing location: {car.city}</span></p></div>
                          <p className="shrink-0 text-right font-bold">{formatInr(car.asking_price)}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{car.kilometers_driven.toLocaleString("en-IN")} km</span><span>{car.fuel_type}</span><span>{car.transmission}</span>
                        </div>
                        <PriceAssessment comparison={priceComparisons[car.id] ?? null} compact />
                        <span className="sr-only">View car details</span>
                      </CardContent>
                    </Link>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
                      {sellerNames[car.id] ? <p className="min-w-0 truncate text-sm"><span className="text-muted-foreground">Seller</span><span className="mx-1.5 text-muted-foreground">·</span><span className="font-medium">{sellerNames[car.id]}</span></p> : <span className="text-sm text-muted-foreground">Seller name not shared</span>}
                      <Button asChild size="sm" className="ml-auto"><Link to={`/marketplace/${car.id}`}>Contact Seller</Link></Button>
                    </div>
                  </Card>
                ))}
              </section>
            )}
            <p className="text-center text-xs text-muted-foreground">Listings refresh automatically about every 15 seconds.</p>
          </>
        )}
      </main>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-lg bg-muted/50 p-3"><div className="mb-1 flex items-center gap-1.5 text-muted-foreground">{icon}<span>{label}</span></div><p className="font-medium">{value}</p></div>;
}

function PriceAssessment({ comparison, compact = false }: { comparison: PriceComparison | null; compact?: boolean }) {
  if (!comparison) return <p className={`${compact ? "border-t pt-2" : "border-t pt-3"} text-xs text-muted-foreground`}>Price estimate unavailable</p>;
  const ratingStyle = comparison.rating === "below"
    ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
    : comparison.rating === "above"
      ? "border-rose-600/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
      : "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  return <div className={`${compact ? "border-t pt-2" : "border-t pt-3"} space-y-2`}>
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
      <span className="text-muted-foreground">AI-estimated market price</span>
      <strong>{formatInr(comparison.estimatedPrice)}</strong>
    </div>
    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={ratingStyle}>{comparison.ratingLabel}</Badge><span className="text-xs text-muted-foreground">Difference {formatInr(Math.abs(comparison.difference))} ({formatPercentage(comparison.percentageDifference)})</span></div>
    <p className="text-xs leading-5 text-muted-foreground">{getPriceComparisonDescription(comparison)}</p>
  </div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="relative"><span className="sr-only">Filter by {label.toLowerCase()}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"><option value="">All {label.toLowerCase()}s</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function NumberFilter({ label, value, onChange, min, max }: { label: string; value: string; onChange: (value: string) => void; min: number; max?: number }) {
  return <Input type="number" inputMode="numeric" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} aria-label={label} />;
}

function PhotoFallback() {
  return <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-muted text-muted-foreground"><CarFront className="h-12 w-12" /></div>;
}

function LoadingState() {
  return <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" />Loading published cars…</div>;
}

function ErrorState({ message }: { message: string }) {
  return <Card><CardContent className="py-12 text-center"><p role="alert" className="text-sm text-destructive">{message}</p></CardContent></Card>;
}

function EmptyState({ detail }: { detail: string }) {
  return <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><CarFront className="h-10 w-10 text-muted-foreground" /><h2 className="text-lg font-semibold">No car to show</h2><p className="max-w-md text-sm text-muted-foreground">{detail}</p><Button asChild variant="outline"><Link to="/">Try the price estimator</Link></Button></CardContent></Card>;
}
