import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, IndianRupee, LoaderCircle, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AccountShell } from "@/components/AccountShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { brandModels, brandOptions, fuelTypeOptions, transmissionOptions } from "@/data/mockCarData";
import { fetchPredictedPrice, predictPriceLocal, type PredictInput } from "@/lib/predictPrice";
import { removeListingImages, uploadListingImages } from "@/lib/listingImages";
import { normalizeIndianMobile } from "@/lib/indianMobile";
import { compareAskingPrice, formatInr, formatPercentage, getPriceComparisonDescription } from "@/lib/priceComparison";

type Listing = Tables<"car_listings">;
type ListingStatus = Listing["status"];
type Estimate = { value: number; source: "edge" | "local" };

interface FormValues {
  brand: string;
  model: string;
  year: string;
  fuelType: string;
  transmission: string;
  kilometers: string;
  previousOwners: string;
  askingPrice: string;
  city: string;
  description: string;
}

const blankForm: FormValues = {
  brand: "", model: "", year: "", fuelType: "", transmission: "",
  kilometers: "", previousOwners: "", askingPrice: "", city: "", description: "",
};
const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const currentYear = new Date().getFullYear();
const allowedPhotoTypes = ["image/jpeg", "image/png", "image/webp"];

function inr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function predictInput(values: FormValues): PredictInput {
  return {
    year: Number(values.year),
    kmsDriven: Number(values.kilometers),
    fuelType: values.fuelType,
    transmission: values.transmission,
    carName: values.model,
    owner: Number(values.previousOwners),
  };
}

function predictionLimitation(values: FormValues): string {
  if (!values.brand || !values.model || !values.year || !values.fuelType || !values.transmission || !values.kilometers || values.previousOwners === "") {
    return "Complete the vehicle details before estimating the price.";
  }
  const year = Number(values.year);
  const kilometers = Number(values.kilometers);
  const owners = Number(values.previousOwners);
  if (year < 1980 || year > 2100) return "The current AI model supports manufacturing years from 1980 onward.";
  if (!Number.isInteger(kilometers) || kilometers < 0 || kilometers > 1_000_000) return "The current AI model supports up to 10,00,000 km.";
  if (!Number.isInteger(owners) || owners < 0 || owners > 5) return "The current AI model supports up to 5 previous owners.";
  if (values.fuelType === "Electric") return "The current AI model does not include electric cars. You can still save this listing without an estimate.";
  if (!["Petrol", "Diesel", "CNG"].includes(values.fuelType)) return "This fuel type is not supported by the current AI model.";
  if (!["Manual", "Automatic"].includes(values.transmission)) return "This transmission is not supported by the current AI model.";
  return "";
}

export default function SellerListingForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormValues>(blankForm);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [predictionWarning, setPredictionWarning] = useState("");
  const [imageError, setImageError] = useState("");
  const [loadingListing, setLoadingListing] = useState(isEditing);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [phoneValidationError, setPhoneValidationError] = useState(false);
  const [listingStatus, setListingStatus] = useState<ListingStatus>("draft");

  const models = useMemo(() => form.brand ? brandModels[form.brand] ?? [] : [], [form.brand]);
  const selectedFuelTypes = useMemo(() => fuelTypeOptions, []);
  const selectedTransmissions = useMemo(() => transmissionOptions, []);
  const predictionNote = predictionLimitation(form);
  const sellerPriceComparison = estimate
    ? compareAskingPrice(Number(form.askingPrice), estimate.value * 100_000)
    : null;

  useEffect(() => {
    const previews = photos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(previews);
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    setLoadingListing(true);
    void supabase.from("car_listings").select("*").eq("id", id).single().then(({ data, error: queryError }) => {
      if (cancelled) return;
      if (queryError || !data) {
        setError("This listing could not be loaded. It may have been removed or you may not have access.");
      } else {
        setForm({
          brand: data.brand,
          model: data.model,
          year: String(data.manufacturing_year),
          fuelType: data.fuel_type,
          transmission: data.transmission,
          kilometers: String(data.kilometers_driven),
          previousOwners: String(Math.max(0, data.number_of_owners - 1)),
          askingPrice: String(data.asking_price),
          city: data.city,
          description: data.description,
        });
        setExistingImages(data.image_urls);
        setListingStatus(data.status);
        if (data.estimated_price !== null) setEstimate({ value: data.estimated_price, source: "edge" });
      }
      setLoadingListing(false);
    });
    return () => { cancelled = true; };
  }, [id, user]);

  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setEstimate(null);
    setPredictionWarning("");
    setError("");
  };

  const validateForm = (status: ListingStatus): string => {
    if (form.brand.trim().length < 1 || form.brand.length > 80) return "Choose a valid car brand.";
    if (form.model.trim().length < 1 || form.model.length > 100) return "Choose a valid car model.";
    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 1950 || year > currentYear) return `Choose a manufacturing year from 1950 to ${currentYear}.`;
    if (!form.fuelType || !fuelTypeOptions.includes(form.fuelType)) return "Choose a fuel type.";
    if (!form.transmission || !transmissionOptions.includes(form.transmission)) return "Choose a transmission.";
    const kilometers = Number(form.kilometers);
    if (!Number.isInteger(kilometers) || kilometers < 0 || kilometers > 2_000_000) return "Kilometers driven must be between 0 and 20,00,000.";
    const previousOwners = Number(form.previousOwners);
    if (!Number.isInteger(previousOwners) || previousOwners < 0 || previousOwners > 9) return "Previous owners must be between 0 and 9.";
    const askingPrice = Number(form.askingPrice);
    if (!Number.isFinite(askingPrice) || askingPrice <= 0 || askingPrice > 9_999_999_999) return "Enter a valid asking price in INR.";
    if (form.city.trim().length < 1 || form.city.trim().length > 100) return "Enter a city (up to 100 characters).";
    if (form.description.length > 10_000) return "The description must be 10,000 characters or fewer.";
    if (existingImages.length + photos.length > MAX_PHOTOS) return `A listing can have up to ${MAX_PHOTOS} photos.`;
    if (status === "active" && existingImages.length + photos.length === 0) return "Add at least one photo before publishing.";
    return "";
  };

  const calculateEstimate = async (): Promise<number | null> => {
    const limitation = predictionLimitation(form);
    if (limitation) {
      setPredictionWarning(limitation);
      return null;
    }

    setCalculating(true);
    setPredictionWarning("");
    const input = predictInput(form);
    try {
      const result = await fetchPredictedPrice(input);
      if (result.currency !== "INR_Lakhs" || !Number.isFinite(result.predictedPrice) || result.predictedPrice <= 0) {
        throw new Error("Prediction returned an unsupported value.");
      }
      setEstimate({ value: result.predictedPrice, source: "edge" });
      return result.predictedPrice;
    } catch {
      // Match the existing estimator's bundled-model fallback; all form values remain in state.
      const localResult = predictPriceLocal(input);
      if (!Number.isFinite(localResult.predictedPrice) || localResult.predictedPrice <= 0) {
        setPredictionWarning("The AI estimate is unavailable for these details. Your listing information is still saved in the form.");
        return null;
      }
      setEstimate({ value: localResult.predictedPrice, source: "local" });
      setPredictionWarning("The prediction service could not be reached, so the existing bundled model supplied this estimate.");
      return localResult.predictedPrice;
    } finally {
      setCalculating(false);
    }
  };

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setImageError("");
    const badType = selected.find((file) => !allowedPhotoTypes.includes(file.type));
    if (badType) return setImageError("Use JPG, PNG, or WebP photos.");
    const oversized = selected.find((file) => file.size > MAX_PHOTO_BYTES);
    if (oversized) return setImageError("Each photo must be 10 MB or smaller.");
    if (existingImages.length + photos.length + selected.length > MAX_PHOTOS) return setImageError(`Choose no more than ${MAX_PHOTOS} photos in total.`);
    setPhotos((current) => [...current, ...selected]);
  };

  const saveListing = async (newStatus: "draft" | "active") => {
    setError("");
    setPhoneValidationError(false);
    if (newStatus === "active" && !normalizeIndianMobile(profile?.phone ?? "")) {
      setPhoneValidationError(true);
      return;
    }
    const validationError = validateForm(newStatus);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!user) {
      setError("Your session expired. Sign in again before saving this listing.");
      return;
    }

    setSaving(true);
    let uploadedUrls: string[] = [];
    try {
      let estimateValue = estimate?.value ?? null;
      if (estimateValue === null && !predictionLimitation(form)) {
        estimateValue = await calculateEstimate();
      }

      uploadedUrls = await uploadListingImages(user.id, photos);
      const imageUrls = [...existingImages, ...uploadedUrls];
      const listingValues = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        manufacturing_year: Number(form.year),
        fuel_type: form.fuelType,
        transmission: form.transmission,
        engine_size: null,
        kilometers_driven: Number(form.kilometers),
        number_of_owners: Number(form.previousOwners) + 1,
        description: form.description.trim(),
        city: form.city.trim(),
        asking_price: Number(form.askingPrice),
        // The prediction service returns INR_Lakhs; preserve its original model unit.
        estimated_price: estimateValue,
        image_urls: imageUrls,
      };

      const result = isEditing && id
        ? await supabase.from("car_listings").update(
          listingStatus === "draft" && newStatus === "active" ? { ...listingValues, status: "active" } : listingValues,
        ).eq("id", id).select("id").single()
        : await supabase.from("car_listings").insert({ ...listingValues, seller_id: user.id, status: newStatus }).select("id").single();

      if (result.error) throw result.error;
      const removedImages = existingImages.filter((url) => !imageUrls.includes(url));
      if (removedImages.length) {
        try { await removeListingImages(user.id, removedImages); }
        catch { toast.warning("Listing saved, but some removed photos could not be deleted from Storage."); }
      }
      if (estimate?.source === "local") toast.info("Saved using the existing local price model because the prediction service was unavailable.");
      toast.success(newStatus === "active"
        ? "Your car is published and will appear in Browse Cars shortly."
        : isEditing ? "Your listing changes were saved." : "Your draft was saved.");
      navigate("/seller/listings", { replace: true });
    } catch (reason) {
      if (uploadedUrls.length) {
        try { await removeListingImages(user.id, uploadedUrls); } catch { /* Keep the original save error visible. */ }
      }
      const databaseError = reason && typeof reason === "object" ? reason as { code?: unknown; message?: unknown } : null;
      if (databaseError?.code === "23514" && typeof databaseError.message === "string" && databaseError.message.includes("valid Indian mobile")) {
        setPhoneValidationError(true);
      } else {
        setError(reason instanceof Error ? reason.message : "The listing could not be saved. Check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const submitDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveListing("draft");
  };

  if (loadingListing) {
    return <AccountShell title="Edit listing" subtitle="Loading the car details."><div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-5 w-5 animate-spin" />Loading listing…</div></AccountShell>;
  }

  if (isEditing && error && !form.brand) {
    return <AccountShell title="Edit listing" subtitle="This listing is unavailable."><Card><CardContent className="space-y-4 py-8"><p role="alert" className="text-sm text-destructive">{error}</p><Button asChild variant="outline"><Link to="/seller/listings">Back to My Listings</Link></Button></CardContent></Card></AccountShell>;
  }

  return (
    <AccountShell title={isEditing ? "Edit car listing" : "Add a car"} subtitle={isEditing ? "Update your vehicle details, asking price and photos." : "Add accurate details and photos to prepare your car listing."}>
      <div className="mb-5"><Button asChild variant="ghost"><Link to="/seller/listings"><ArrowLeft className="mr-2 h-4 w-4" />Back to My Listings</Link></Button></div>
      <form onSubmit={submitDraft} className="space-y-6">
        {phoneValidationError && <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">Add a valid Indian mobile number in <Link to="/account" className="font-semibold underline">Account settings</Link> before publishing. Use a 10-digit number such as 9876543210 or include +91.</div>}
        {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
        <Card>
          <CardHeader><CardTitle>Vehicle details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Brand" htmlFor="brand"><Select value={form.brand} onValueChange={(value) => { setField("brand", value); setField("model", ""); }}><SelectTrigger id="brand"><SelectValue placeholder="Select brand" /></SelectTrigger><SelectContent>{brandOptions.map((brand) => <SelectItem value={brand} key={brand}>{brand}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Model" htmlFor="model"><Select value={form.model} onValueChange={(value) => setField("model", value)} disabled={!form.brand}><SelectTrigger id="model"><SelectValue placeholder={form.brand ? "Select model" : "Choose a brand first"} /></SelectTrigger><SelectContent>{models.map((model) => <SelectItem value={model} key={model}>{model}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Manufacturing year" htmlFor="year"><Input id="year" type="number" inputMode="numeric" min={1950} max={currentYear} step={1} required value={form.year} onChange={(event) => setField("year", event.target.value)} placeholder={`e.g. ${currentYear - 5}`} /></Field>
            <Field label="Fuel type" htmlFor="fuel"><Select value={form.fuelType} onValueChange={(value) => setField("fuelType", value)}><SelectTrigger id="fuel"><SelectValue placeholder="Select fuel" /></SelectTrigger><SelectContent>{selectedFuelTypes.map((fuel) => <SelectItem value={fuel} key={fuel}>{fuel}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Transmission" htmlFor="transmission"><Select value={form.transmission} onValueChange={(value) => setField("transmission", value)}><SelectTrigger id="transmission"><SelectValue placeholder="Select transmission" /></SelectTrigger><SelectContent>{selectedTransmissions.map((transmission) => <SelectItem value={transmission} key={transmission}>{transmission}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Kilometers driven" htmlFor="kilometers"><Input id="kilometers" type="number" inputMode="numeric" min={0} max={2_000_000} step={1} required value={form.kilometers} onChange={(event) => setField("kilometers", event.target.value)} placeholder="e.g. 45000" /></Field>
            <Field label="Previous owners" htmlFor="owners"><Select value={form.previousOwners} onValueChange={(value) => setField("previousOwners", value)}><SelectTrigger id="owners"><SelectValue placeholder="Select previous owners" /></SelectTrigger><SelectContent>{Array.from({ length: 10 }, (_, count) => <SelectItem value={String(count)} key={count}>{count === 0 ? "No previous owners (first owner)" : `${count} previous owner${count === 1 ? "" : "s"}`}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Asking price (INR)" htmlFor="asking-price"><div className="relative"><IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="asking-price" type="number" inputMode="numeric" min={1} max={9_999_999_999} step="1" required value={form.askingPrice} onChange={(event) => setField("askingPrice", event.target.value)} placeholder="e.g. 650000" className="pl-9" /></div></Field>
            <Field label="City" htmlFor="city"><Input id="city" maxLength={100} required value={form.city} onChange={(event) => setField("city", event.target.value)} placeholder="e.g. Pune" /></Field>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3"><Label htmlFor="description">Description <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="description" maxLength={10000} rows={5} value={form.description} onChange={(event) => setField("description", event.target.value)} placeholder="Share service history, features and any details buyers should know." /><p className="text-right text-xs text-muted-foreground">{form.description.length}/10,000</p></div>
            <div className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">Engine size is not an input to the existing price prediction model, so it is omitted from this form. The database field remains empty.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Car photos</CardTitle><p className="text-sm text-muted-foreground">Upload up to {MAX_PHOTOS} JPG, PNG or WebP photos, up to 10 MB each.</p></CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="car-photos" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-5 text-center transition hover:bg-muted/60">
              <Upload className="mb-2 h-6 w-6 text-primary" /><span className="text-sm font-medium">Choose car photos</span><span className="mt-1 text-xs text-muted-foreground">{existingImages.length + photos.length} of {MAX_PHOTOS} selected</span>
            </Label>
            <Input id="car-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={addPhotos} disabled={existingImages.length + photos.length >= MAX_PHOTOS} />
            {imageError && <p role="alert" className="text-sm text-destructive">{imageError}</p>}
            {(existingImages.length > 0 || photos.length > 0) && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {existingImages.map((url, index) => <PhotoTile key={url} src={url} label={`Existing car photo ${index + 1}`} onRemove={() => setExistingImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} />)}
              {photos.map((file, index) => <PhotoTile key={`${file.name}-${index}`} src={photoPreviews[index]} label={file.name} onRemove={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} />)}
            </div>}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI price estimate</CardTitle><p className="text-sm text-muted-foreground">The existing model returns INR Lakhs. This is separate from your asking price, which is entered in INR.</p></CardHeader>
          <CardContent className="space-y-3">
            {estimate ? <div className="rounded-xl bg-primary/5 p-4"><p className="text-sm text-muted-foreground">Estimated value · INR Lakhs</p><p className="mt-1 text-2xl font-bold">₹{estimate.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Lakh</p><p className="mt-1 text-xs text-muted-foreground">{estimate.source === "edge" ? "From the deployed predict-price function." : "Calculated by the existing bundled fallback model."}</p>{sellerPriceComparison && <div className="mt-3 space-y-1 border-t border-primary/15 pt-3"><p className="text-sm font-semibold">{sellerPriceComparison.ratingLabel}</p><p className="text-sm text-muted-foreground">{getPriceComparisonDescription(sellerPriceComparison)}</p><p className="text-xs text-muted-foreground">Difference {formatInr(Math.abs(sellerPriceComparison.difference))} ({formatPercentage(sellerPriceComparison.percentageDifference)}). You remain in control of your asking price.</p></div>}</div> : <p className="text-sm text-muted-foreground">{predictionNote || "Estimate using the existing trained model after entering the supported vehicle details."}</p>}
            {predictionWarning && <p role="status" className="text-sm text-amber-700 dark:text-amber-300">{predictionWarning}</p>}
            <Button type="button" variant="outline" onClick={() => void calculateEstimate()} disabled={calculating || Boolean(predictionNote)}><Sparkles className="mr-2 h-4 w-4" />{calculating ? "Calculating…" : "Calculate AI estimate"}</Button>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button type="submit" variant="outline" disabled={saving || calculating}>{saving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}{isEditing ? "Save changes" : "Save draft"}</Button>
          {!isEditing && <Button type="button" onClick={() => void saveListing("active")} disabled={saving || calculating}>{saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Publish listing</Button>}
          {isEditing && listingStatus === "draft" && <Button type="button" onClick={() => void saveListing("active")} disabled={saving || calculating}>{saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Save and publish</Button>}
        </div>
      </form>
    </AccountShell>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

function PhotoTile({ src, label, onRemove }: { src: string; label: string; onRemove: () => void }) {
  return <div className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
    <img src={src} alt={label} className="h-full w-full object-cover" />
    <Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2 h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100" onClick={onRemove} aria-label={`Remove ${label}`}><Trash2 className="h-4 w-4" /></Button>
    <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-xs text-white">{label}</span>
  </div>;
}
