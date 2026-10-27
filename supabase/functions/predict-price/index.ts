import { z } from "npm:zod@3.23.8";
import model from "./trainedModel.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const BodySchema = z.object({
  year: z.number().int().min(1980).max(2100),
  kmsDriven: z.number().min(0).max(1_000_000),
  fuelType: z.string(),
  transmission: z.string(),
  sellerType: z.enum(["Dealer", "Individual"]).optional().default("Dealer"),
  owner: z.number().int().min(0).max(5).optional().default(0),
  presentPrice: z.number().positive().optional(),
  carName: z.string().optional(),
});

type ModelJson = {
  intercept: number;
  coefficients: Record<string, number>;
  featureOrder: string[];
  metrics: { r2: number; mae: number; rmse: number };
  trainedOn: string;
  trainedAt: string;
  currentYearAtTraining: number;
  presentPriceLookup: Record<string, number>;
  overallAvgPresentPrice: number;
  topFeatures: Array<{ name: string; coefficient: number }>;
  datasetRows: number;
  algorithm: string;
};

const M = model as ModelJson;

function resolvePresentPrice(carName: string | undefined, provided: number | undefined): number {
  if (provided && provided > 0) return provided;
  if (carName) {
    const key = carName.toLowerCase().trim();
    if (M.presentPriceLookup[key]) return M.presentPriceLookup[key];
    // Try matching first word (e.g. "Swift VXI" -> "swift")
    const first = key.split(/\s+/)[0];
    for (const k of Object.keys(M.presentPriceLookup)) {
      if (k === first || k.startsWith(first)) return M.presentPriceLookup[k];
    }
  }
  return M.overallAvgPresentPrice;
}

function buildFeatureVector(input: z.infer<typeof BodySchema>): Record<string, number> {
  const carAge = M.currentYearAtTraining - input.year;
  const presentPrice = resolvePresentPrice(input.carName, input.presentPrice);
  const fuel = input.fuelType;
  const trans = input.transmission;
  const sellerType = input.sellerType ?? "Dealer";

  return {
    Present_Price: presentPrice,
    Kms_Driven: input.kmsDriven,
    Owner: input.owner ?? 0,
    Car_Age: Math.max(0, carAge),
    Fuel_Type_Diesel: fuel === "Diesel" ? 1 : 0,
    Fuel_Type_Petrol: fuel === "Petrol" ? 1 : 0,
    Fuel_Type_CNG: fuel === "CNG" ? 1 : 0,
    Seller_Type_Dealer: sellerType === "Dealer" ? 1 : 0,
    Seller_Type_Individual: sellerType === "Individual" ? 1 : 0,
    Transmission_Manual: trans === "Manual" ? 1 : 0,
    Transmission_Automatic: trans === "Automatic" ? 1 : 0,
  };
}

function predict(features: Record<string, number>): number {
  let sum = M.intercept;
  for (const f of M.featureOrder) {
    sum += (M.coefficients[f] ?? 0) * (features[f] ?? 0);
  }
  return sum;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      // Return model metadata
      return new Response(
        JSON.stringify({
          algorithm: M.algorithm,
          metrics: M.metrics,
          trainedOn: M.trainedOn,
          trainedAt: M.trainedAt,
          datasetRows: M.datasetRows,
          topFeatures: M.topFeatures,
          featureCount: M.featureOrder.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const features = buildFeatureVector(parsed.data);
    const raw = predict(features);
    // Clamp to a reasonable minimum (used cars don't have negative price)
    const predictedPrice = Math.max(0.3, Math.round(raw * 100) / 100);

    return new Response(
      JSON.stringify({
        predictedPrice,
        currency: "INR_Lakhs",
        resolvedPresentPrice: features.Present_Price,
        metrics: M.metrics,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
