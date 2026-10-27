
User confirmed: Kaggle CarDekho dataset + Linear Regression. Default to Option A (train offline in Python, serve via Lovable Cloud edge function in TypeScript) since that's the only way to keep it fully inside Lovable. Keep the plan tight.

# Plan: Real Linear Regression Model trained on CarDekho Dataset

## Approach
Train a Linear Regression model **once** in Python on the Kaggle CarDekho dataset, export the learned coefficients to JSON, and serve real predictions from a Lovable Cloud edge function. The frontend stops using the hardcoded formula and calls the edge function.

## Steps

### 1. Get the dataset
Download the CarDekho "Vehicle Dataset from CarDekho" CSV (the standard `car data.csv` with columns: `Car_Name, Year, Selling_Price, Present_Price, Kms_Driven, Fuel_Type, Seller_Type, Transmission, Owner`) into the sandbox.

### 2. Train in Python (one-time, in sandbox)
- Load CSV with pandas.
- Feature engineering: `Car_Age = currentYear - Year`, one-hot encode `Fuel_Type`, `Seller_Type`, `Transmission`, keep `Present_Price`, `Kms_Driven`, `Owner`.
- Fit `sklearn.linear_model.LinearRegression`.
- Print metrics: **R²**, **MAE**, **RMSE** on a held-out test split.
- Export to `src/data/trainedModel.json`:
  ```json
  {
    "intercept": ...,
    "coefficients": { "Car_Age": ..., "Present_Price": ..., "Kms_Driven": ..., "Fuel_Type_Diesel": ..., ... },
    "featureOrder": [...],
    "metrics": { "r2": ..., "mae": ..., "rmse": ... },
    "trainedOn": "CarDekho - 301 rows",
    "trainedAt": "2026-04-19"
  }
  ```

### 3. Enable Lovable Cloud + edge function
- Enable Lovable Cloud (required for edge functions).
- Create `supabase/functions/predict-price/index.ts` that:
  - Reads the JSON model (bundled with the function).
  - Accepts `{ year, kmsDriven, fuelType, transmission, sellerType, presentPrice, owner }`.
  - Computes `prediction = intercept + Σ (coef_i × feature_i)`.
  - Returns `{ predictedPrice, currency: "INR_Lakhs" }` with CORS headers.
  - Validates input with Zod.

### 4. Wire up the frontend
- Replace `predictPrice()` in `src/data/mockCarData.ts` with an async `fetchPredictedPrice()` that calls `supabase.functions.invoke('predict-price', { body: {...} })`.
- Update `PriceInputForm` submit handler to `await` the prediction and pass the result through to `/result`.
- Add a small "Present Price" input (CarDekho needs ex-showroom price) OR estimate it from brand/model averages so the existing form still works without a new field. **Recommended: estimate from a brand-model lookup so we don't change the form UX.**
- Add a loading state on the "Check Price" button.

### 5. Model Info section
Add a small card on the homepage (or `/model-info` route) showing:
- Algorithm: Linear Regression
- Dataset: CarDekho (rows count)
- R², MAE, RMSE from training
- Top 5 features by absolute coefficient

## What stays / what changes
- ✅ Form, routing, EDA dashboard, brand grid, result page UI: **unchanged**.
- 🔄 Prediction logic: **mock formula → real trained model via edge function**.
- ➕ New: Lovable Cloud, edge function, `trainedModel.json`, model info card.

## Tradeoff to confirm
The CarDekho dataset only has ~301 rows and uses `Present_Price` (ex-showroom) as a feature. Linear Regression on it typically reaches R² ≈ 0.85. Since your form doesn't ask for ex-showroom price, I'll auto-estimate it from a brand-model lookup table built from the dataset itself. Predictions will be real but bounded by dataset size.

Confirm and I'll switch to build mode and execute all steps.
