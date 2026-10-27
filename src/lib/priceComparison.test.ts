import { describe, expect, it, vi } from "vitest";
import {
  compareAskingPrice,
  formatInr,
  formatPercentage,
  getListingPriceComparison,
  type ListingPriceInput,
} from "@/lib/priceComparison";
import type { PredictInput, PredictResult } from "@/lib/predictPrice";

const estimate = 1_000_000;
const listing: ListingPriceInput = {
  brand: "Maruti",
  model: "Swift",
  manufacturing_year: 2018,
  fuel_type: "Petrol",
  transmission: "Manual",
  kilometers_driven: 50_000,
  number_of_owners: 2,
  asking_price: estimate,
};

const prediction = (predictedPrice: number, currency: PredictResult["currency"] = "INR_Lakhs"): PredictResult => ({
  predictedPrice,
  currency,
  resolvedPresentPrice: 5,
  metrics: { r2: 0.8, mae: 1, rmse: 2 },
});

describe("compareAskingPrice", () => {
  it("rates a price below the lower threshold", () => {
    expect(compareAskingPrice(949_999, estimate)?.rating).toBe("below");
  });

  it("treats exactly the lower threshold as fairly priced", () => {
    expect(compareAskingPrice(950_000, estimate)?.rating).toBe("fair");
  });

  it("treats an equal asking and estimate as fairly priced", () => {
    expect(compareAskingPrice(estimate, estimate)?.rating).toBe("fair");
  });

  it("treats exactly the upper threshold as fairly priced", () => {
    expect(compareAskingPrice(1_050_000, estimate)?.rating).toBe("fair");
  });

  it("rates a price above the upper threshold", () => {
    expect(compareAskingPrice(1_050_001, estimate)?.rating).toBe("above");
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, null, undefined])(
    "rejects invalid estimated price %s",
    (invalid) => expect(compareAskingPrice(estimate, invalid as number)).toBeNull(),
  );

  it("rejects invalid asking prices", () => {
    expect(compareAskingPrice(0, estimate)).toBeNull();
    expect(compareAskingPrice(Number.NaN, estimate)).toBeNull();
  });
});

describe("getListingPriceComparison", () => {
  it("reuses the local model and converts its INR Lakhs point estimate to INR", () => {
    const predictor = vi.fn((_input: PredictInput) => prediction(10));
    const result = getListingPriceComparison(listing, predictor);
    expect(result?.estimatedPrice).toBe(1_000_000);
    expect(predictor).toHaveBeenCalledWith({
      year: 2018,
      kmsDriven: 50_000,
      fuelType: "Petrol",
      transmission: "Manual",
      carName: "Swift",
      owner: 1,
    });
  });

  it("returns unavailable for missing vehicle attributes without calling the model", () => {
    const predictor = vi.fn((_input: PredictInput) => prediction(10));
    const missing = { ...listing, model: undefined } as unknown as ListingPriceInput;
    expect(getListingPriceComparison(missing, predictor)).toBeNull();
    expect(predictor).not.toHaveBeenCalled();
  });

  it("returns unavailable for unsupported fuel or transmission", () => {
    expect(getListingPriceComparison({ ...listing, fuel_type: "Electric" })).toBeNull();
    expect(getListingPriceComparison({ ...listing, transmission: "CVT" })).toBeNull();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid model prediction %s", (value) => {
    expect(getListingPriceComparison(listing, () => prediction(value))).toBeNull();
  });

  it("rejects a prediction with an unexpected currency", () => {
    const badCurrency = { ...prediction(10), currency: "USD" } as unknown as PredictResult;
    expect(getListingPriceComparison(listing, () => badCurrency)).toBeNull();
  });

  it("returns unavailable when prediction throws", () => {
    expect(getListingPriceComparison(listing, () => { throw new Error("model failure"); })).toBeNull();
  });
});

describe("price comparison formatting", () => {
  it("formats INR using Indian digit grouping", () => {
    expect(formatInr(1_234_567)).toBe("₹12,34,567");
  });

  it("formats signed percentages to one decimal place", () => {
    expect(formatPercentage(12.36)).toBe("+12.4%");
    expect(formatPercentage(-5)).toBe("−5%");
  });
});
