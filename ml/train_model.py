"""
CarDekho Used Car Price Prediction - Linear Regression Model Training
=====================================================================
Data Science Lab Project
Dataset: Vehicle Dataset from CarDekho (Kaggle)
Algorithm: Linear Regression (scikit-learn)

This script performs:
1. Data loading and exploration
2. Feature engineering (Car_Age, one-hot encoding)
3. Model training with train/test split
4. Evaluation metrics (R², MAE, RMSE)
5. Export of model coefficients for production use

Author: Student Project
Date: 2026-04-20
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import json
import warnings
warnings.filterwarnings('ignore')

# Configuration
DATASET_PATH = "car_data.csv"  # Download from Kaggle: "Vehicle Dataset from CarDekho"
CURRENT_YEAR = 2026
OUTPUT_JSON = "../src/data/trainedModel.json"

print("=" * 60)
print("CarDekho Used Car Price Prediction - Model Training")
print("=" * 60)

# ============================================================================
# 1. LOAD DATASET
# ============================================================================
print("\n[1] Loading dataset...")
try:
    df = pd.read_csv(DATASET_PATH)
    print(f"✓ Loaded {len(df)} rows from {DATASET_PATH}")
except FileNotFoundError:
    print(f"✗ Dataset not found: {DATASET_PATH}")
    print("  Please download from Kaggle: https://www.kaggle.com/datasets/nehalbirla/vehicle-dataset-from-cardekho")
    exit(1)

print(f"\nDataset Info:")
print(f"  - Rows: {len(df)}")
print(f"  - Columns: {list(df.columns)}")
print(f"\nFirst 5 rows:")
print(df.head())

# ============================================================================
# 2. FEATURE ENGINEERING
# ============================================================================
print("\n" + "=" * 60)
print("[2] Feature Engineering")
print("=" * 60)

# Create Car_Age feature (current year - manufacturing year)
df['Car_Age'] = CURRENT_YEAR - df['Year']
print(f"✓ Created 'Car_Age' = {CURRENT_YEAR} - Year")

# One-hot encode categorical variables
print("\nEncoding categorical variables...")

# Fuel_Type: Diesel, Petrol, CNG
fuel_dummies = pd.get_dummies(df['Fuel_Type'], prefix='Fuel_Type')
print(f"  Fuel_Type: {df['Fuel_Type'].unique()}")

# Seller_Type: Dealer, Individual
seller_dummies = pd.get_dummies(df['Seller_Type'], prefix='Seller_Type')
print(f"  Seller_Type: {df['Seller_Type'].unique()}")

# Transmission: Manual, Automatic
trans_dummies = pd.get_dummies(df['Transmission'], prefix='Transmission')
print(f"  Transmission: {df['Transmission'].unique()}")

# Combine all features
feature_df = pd.concat([
    df[['Present_Price', 'Kms_Driven', 'Owner', 'Car_Age']],
    fuel_dummies,
    seller_dummies,
    trans_dummies
], axis=1)

# Target variable
y = df['Selling_Price']

print(f"\n✓ Feature matrix shape: {feature_df.shape}")
print(f"✓ Target vector shape: {y.shape}")

# Display feature statistics
print("\nFeature Statistics:")
print(feature_df.describe())

# ============================================================================
# 3. TRAIN-TEST SPLIT
# ============================================================================
print("\n" + "=" * 60)
print("[3] Train-Test Split")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    feature_df, y, test_size=0.2, random_state=42
)

print(f"Training set: {len(X_train)} samples ({len(X_train)/len(feature_df)*100:.1f}%)")
print(f"Test set: {len(X_test)} samples ({len(X_test)/len(feature_df)*100:.1f}%)")

# ============================================================================
# 4. MODEL TRAINING
# ============================================================================
print("\n" + "=" * 60)
print("[4] Model Training - Linear Regression")
print("=" * 60)

model = LinearRegression()
model.fit(X_train, y_train)

print("✓ Model trained successfully!")
print(f"\nModel Parameters:")
print(f"  Intercept: {model.intercept_:.10f}")

print(f"\nCoefficients:")
for feature, coef in zip(feature_df.columns, model.coef_):
    print(f"  {feature:25s}: {coef:15.10f}")

# ============================================================================
# 5. MODEL EVALUATION
# ============================================================================
print("\n" + "=" * 60)
print("[5] Model Evaluation")
print("=" * 60)

# Predictions
y_train_pred = model.predict(X_train)
y_test_pred = model.predict(X_test)

# Metrics
train_r2 = r2_score(y_train, y_train_pred)
test_r2 = r2_score(y_test, y_test_pred)
test_mae = mean_absolute_error(y_test, y_test_pred)
test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))

print("\nTraining Set Performance:")
print(f"  R² Score: {train_r2:.4f}")

print("\nTest Set Performance:")
print(f"  R² Score: {test_r2:.4f} (explains {test_r2*100:.1f}% of variance)")
print(f"  MAE: {test_mae:.4f} (mean absolute error in Lakhs)")
print(f"  RMSE: {test_rmse:.4f} (root mean squared error in Lakhs)")

# ============================================================================
# 6. FEATURE IMPORTANCE ANALYSIS
# ============================================================================
print("\n" + "=" * 60)
print("[6] Top 5 Most Influential Features")
print("=" * 60)

feature_importance = list(zip(feature_df.columns, model.coef_))
feature_importance.sort(key=lambda x: abs(x[1]), reverse=True)

print("\nRank | Feature                   | Coefficient")
print("-" * 50)
for i, (feat, coef) in enumerate(feature_importance[:5], 1):
    print(f"{i:4d} | {feat:25s} | {coef:10.4f}")

# ============================================================================
# 7. BUILD PRESENT PRICE LOOKUP TABLE
# ============================================================================
print("\n" + "=" * 60)
print("[7] Building Brand-Model Price Lookup")
print("=" * 60)

# Create lookup table for present prices by car name
present_price_lookup = {}
for _, row in df.iterrows():
    car_name = str(row['Car_Name']).lower().strip()
    price = float(row['Present_Price'])
    if car_name not in present_price_lookup:
        present_price_lookup[car_name] = price

overall_avg = df['Present_Price'].mean()

print(f"✓ Built lookup for {len(present_price_lookup)} unique car models")
print(f"  Overall average Present_Price: ₹{overall_avg:.3f} Lakhs")
print(f"\nSample entries:")
for i, (name, price) in enumerate(list(present_price_lookup.items())[:5]):
    print(f"  {name:30s}: ₹{price:.3f} Lakhs")

# ============================================================================
# 8. EXPORT MODEL TO JSON
# ============================================================================
print("\n" + "=" * 60)
print("[8] Exporting Model to JSON")
print("=" * 60)

model_data = {
    "algorithm": "LinearRegression",
    "intercept": float(model.intercept_),
    "coefficients": {
        feat: float(coef) for feat, coef in zip(feature_df.columns, model.coef_)
    },
    "featureOrder": list(feature_df.columns),
    "metrics": {
        "r2": round(test_r2, 4),
        "mae": round(test_mae, 4),
        "rmse": round(test_rmse, 4)
    },
    "trainedOn": f"CarDekho - {len(df)} rows",
    "trainedAt": "2026-04-19",
    "currentYearAtTraining": CURRENT_YEAR,
    "presentPriceLookup": present_price_lookup,
    "overallAvgPresentPrice": round(overall_avg, 3),
    "topFeatures": [
        {"name": feat, "coefficient": round(coef, 4)}
        for feat, coef in feature_importance[:5]
    ],
    "datasetRows": len(df)
}

# Save JSON
with open(OUTPUT_JSON, 'w') as f:
    json.dump(model_data, f, indent=2)

print(f"✓ Model exported to: {OUTPUT_JSON}")
print(f"\nExport Summary:")
print(f"  Algorithm: {model_data['algorithm']}")
print(f"  Features: {len(model_data['featureOrder'])}")
print(f"  R² Score: {model_data['metrics']['r2']}")
print(f"  Trained on: {model_data['trainedOn']}")

# ============================================================================
# 9. SAMPLE PREDICTION
# ============================================================================
print("\n" + "=" * 60)
print("[9] Sample Prediction Test")
print("=" * 60)

# Example: Swift 2018, Petrol, Manual, 50000 km
sample_input = {
    'Present_Price': 6.342,
    'Kms_Driven': 50000,
    'Owner': 0,
    'Car_Age': 8,
    'Fuel_Type_Diesel': 0,
    'Fuel_Type_Petrol': 1,
    'Fuel_Type_CNG': 0,
    'Seller_Type_Dealer': 1,
    'Seller_Type_Individual': 0,
    'Transmission_Manual': 1,
    'Transmission_Automatic': 0
}

# Manual prediction using coefficients
prediction = model.intercept_
for feat, coef in zip(feature_df.columns, model.coef_):
    prediction += coef * sample_input[feat]

print(f"\nSample Input: Swift (2018), Petrol, Manual, 50,000 km")
print(f"  Present_Price: ₹{sample_input['Present_Price']} Lakhs")
print(f"  Predicted Selling Price: ₹{prediction:.2f} Lakhs")

# ============================================================================
# DONE
# ============================================================================
print("\n" + "=" * 60)
print("✓ MODEL TRAINING COMPLETE")
print("=" * 60)
print("\nFiles generated:")
print(f"  1. {OUTPUT_JSON} - Model for web deployment")
print(f"\nNext steps:")
print(f"  - Deploy the edge function to serve predictions")
print(f"  - Use the exported JSON in the React frontend")
print("=" * 60)
