import { supabase } from "@/integrations/supabase/client";
import trainedModel from "@/data/trainedModel.json";

export interface PredictInput {
  year: number;
  kmsDriven: number;
  fuelType: string;
  transmission: string;
  carName?: string;
  owner?: number;
  sellerType?: "Dealer" | "Individual";
  presentPrice?: number;
}

export interface PredictResult {
  predictedPrice: number;
  currency: "INR_Lakhs";
  resolvedPresentPrice: number;
  metrics: { r2: number; mae: number; rmse: number };
}

export async function fetchPredictedPrice(input: PredictInput): Promise<PredictResult> {
  const { data, error } = await supabase.functions.invoke("predict-price", { body: input });
  if (error) throw error;
  return data as PredictResult;
}

/** Local fallback that mirrors the edge function's math, in case the network call fails. */
export function predictPriceLocal(input: PredictInput): PredictResult {
  const M = trainedModel as typeof trainedModel;
  const key = (input.carName || "").toLowerCase().trim();
  const lookup = M.presentPriceLookup as Record<string, number>;
  let presentPrice = input.presentPrice && input.presentPrice > 0 ? input.presentPrice : lookup[key];
  if (!presentPrice && key) {
    const first = key.split(/\s+/)[0];
    for (const k of Object.keys(lookup)) {
      if (k === first || k.startsWith(first)) { presentPrice = lookup[k]; break; }
    }
  }
  if (!presentPrice) presentPrice = M.overallAvgPresentPrice;

  const carAge = Math.max(0, M.currentYearAtTraining - input.year);
  const f: Record<string, number> = {
    Present_Price: presentPrice,
    Kms_Driven: input.kmsDriven,
    Owner: input.owner ?? 0,
    Car_Age: carAge,
    Fuel_Type_Diesel: input.fuelType === "Diesel" ? 1 : 0,
    Fuel_Type_Petrol: input.fuelType === "Petrol" ? 1 : 0,
    Fuel_Type_CNG: input.fuelType === "CNG" ? 1 : 0,
    Seller_Type_Dealer: (input.sellerType ?? "Dealer") === "Dealer" ? 1 : 0,
    Seller_Type_Individual: input.sellerType === "Individual" ? 1 : 0,
    Transmission_Manual: input.transmission === "Manual" ? 1 : 0,
    Transmission_Automatic: input.transmission === "Automatic" ? 1 : 0,
  };
  const coefs = M.coefficients as Record<string, number>;
  let sum = M.intercept;
  for (const k of M.featureOrder) sum += (coefs[k] ?? 0) * (f[k] ?? 0);
  return {
    predictedPrice: Math.max(0.3, Math.round(sum * 100) / 100),
    currency: "INR_Lakhs",
    resolvedPresentPrice: presentPrice,
    metrics: M.metrics,
  };
}
