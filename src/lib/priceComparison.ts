import type { Tables } from "@/integrations/supabase/types";
import { predictPriceLocal, type PredictInput, type PredictResult } from "@/lib/predictPrice";

export const DEAL_RATING_THRESHOLD_PERCENT = 5;
export type DealRating = "below" | "fair" | "above";

export interface PriceComparison {
  askingPrice: number;
  estimatedPrice: number;
  difference: number;
  percentageDifference: number;
  rating: DealRating;
  ratingLabel: string;
}

export type ListingPriceInput = Pick<Tables<"car_listings">,
  "brand" | "model" | "manufacturing_year" | "fuel_type" | "transmission"
  | "kilometers_driven" | "number_of_owners" | "asking_price"
>;

type LocalPredictor = (input: PredictInput) => PredictResult;

export function compareAskingPrice(
  askingPrice: number,
  estimatedPrice: number,
  thresholdPercent = DEAL_RATING_THRESHOLD_PERCENT,
): PriceComparison | null {
  if (!Number.isFinite(askingPrice) || askingPrice <= 0
    || !Number.isFinite(estimatedPrice) || estimatedPrice <= 0
    || !Number.isFinite(thresholdPercent) || thresholdPercent < 0) return null;

  const difference = askingPrice - estimatedPrice;
  const percentageDifference = (difference / estimatedPrice) * 100;
  if (!Number.isFinite(percentageDifference)) return null;

  const rating: DealRating = percentageDifference < -thresholdPercent
    ? "below"
    : percentageDifference > thresholdPercent ? "above" : "fair";

  return {
    askingPrice,
    estimatedPrice,
    difference,
    percentageDifference,
    rating,
    ratingLabel: rating === "below" ? "Below Estimated Value"
      : rating === "above" ? "Above Estimated Value" : "Fairly Priced",
  };
}

export function getListingPriceComparison(
  listing: ListingPriceInput,
  predictor: LocalPredictor = predictPriceLocal,
): PriceComparison | null {
  if (!listing || typeof listing.brand !== "string" || !listing.brand.trim()
    || typeof listing.model !== "string" || !listing.model.trim()
    || !Number.isInteger(listing.manufacturing_year) || listing.manufacturing_year < 1980 || listing.manufacturing_year > 2100
    || !Number.isInteger(listing.kilometers_driven) || listing.kilometers_driven < 0 || listing.kilometers_driven > 1_000_000
    || !Number.isInteger(listing.number_of_owners) || listing.number_of_owners < 1 || listing.number_of_owners > 6
    || !["Petrol", "Diesel", "CNG"].includes(listing.fuel_type)
    || !["Manual", "Automatic"].includes(listing.transmission)) return null;

  try {
    const result = predictor({
      year: listing.manufacturing_year,
      kmsDriven: listing.kilometers_driven,
      fuelType: listing.fuel_type,
      transmission: listing.transmission,
      carName: listing.model,
      // Listing form input is previous owners; storage records total owners.
      owner: listing.number_of_owners - 1,
    });
    if (result?.currency !== "INR_Lakhs" || !Number.isFinite(result.predictedPrice) || result.predictedPrice <= 0) return null;
    return compareAskingPrice(listing.asking_price, result.predictedPrice * 100_000);
  } catch {
    return null;
  }
}

export function formatInr(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(Math.abs(value));
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatted}%`;
}

export function getPriceComparisonDescription(comparison: PriceComparison): string {
  if (comparison.rating === "fair") return `Asking price is within ${DEAL_RATING_THRESHOLD_PERCENT}% of the AI estimate.`;
  const direction = comparison.rating === "below" ? "below" : "above";
  return `Asking price is approximately ${formatInr(Math.abs(comparison.difference))} (${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(Math.abs(comparison.percentageDifference))}%) ${direction} the AI estimate.`;
}
