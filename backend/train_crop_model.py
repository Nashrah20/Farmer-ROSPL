"""
Complete Machine Learning Pipeline for Crop Prediction
Author: FarmAI System
Dataset: maharashtra_5_soil_types_crop_dataset_100k.csv

This script:
1. Loads agricultural data with soil type feature
2. Preprocesses features (encoding, scaling)
3. Trains multiple ML models
4. Evaluates and selects best model
5. Saves model and preprocessing artifacts
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, classification_report
import warnings
warnings.filterwarnings('ignore')

# Try to import XGBoost (optional)
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("⚠️  XGBoost not available. Install with: pip install xgboost")

print("="*70)
print("🌾 CROP PREDICTION MODEL TRAINING PIPELINE")
print("="*70)

# ============================================================================
# STEP 1: LOAD DATASET
# ============================================================================
print("\n📂 STEP 1: Loading Dataset...")
dataset_path = "Data/maharashtra_5_soil_types_crop_dataset_100k.csv"

try:
    df = pd.read_csv(dataset_path)
    print(f"✅ Dataset loaded successfully!")
    print(f"   Rows: {len(df):,}")
    print(f"   Columns: {df.shape[1]}")
    print(f"\n📊 Dataset Preview:")
    print(df.head())
    print(f"\n📈 Dataset Info:")
    print(df.info())
    print(f"\n🌱 Unique Crops: {df['crop'].nunique()}")
    print(f"   Crop List: {sorted(df['crop'].unique())}")
except FileNotFoundError:
    print(f"❌ Error: Dataset not found at {dataset_path}")
    exit(1)

# ============================================================================
# STEP 2: DATA PREPROCESSING
# ============================================================================
print("\n" + "="*70)
print("🔧 STEP 2: Data Preprocessing...")
print("="*70)

# Check for missing values
print(f"\n🔍 Missing Values:")
print(df.isnull().sum())

# Remove any rows with missing values
if df.isnull().sum().sum() > 0:
    print(f"⚠️  Removing {df.isnull().sum().sum()} rows with missing values...")
    df = df.dropna()

# Separate features and target
X = df.drop('crop', axis=1)
y = df['crop']

print(f"\n📋 Features: {list(X.columns)}")
print(f"🎯 Target: crop ({y.nunique()} classes)")

# Encode season and soil_type columns (one-hot encoding)
print(f"\n🔄 Encoding 'season' column...")
print(f"   Seasons found: {df['season'].unique()}")
print(f"\n🔄 Encoding 'soil_type' column...")
print(f"   Soil types found: {df['soil_type'].unique()}")
X_encoded = pd.get_dummies(X, columns=['season', 'soil_type'], prefix=['season', 'soil'])
print(f"   New feature count: {X_encoded.shape[1]}")

# Encode target variable (crop names to integers)
print(f"\n🔄 Encoding target variable 'crop'...")
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)
print(f"   Crop classes encoded: {len(label_encoder.classes_)}")

# Scale numerical features
print(f"\n📏 Scaling numerical features...")
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_encoded)
print(f"   ✅ Features scaled using StandardScaler")

# ============================================================================
# STEP 3: SPLIT DATA
# ============================================================================
print("\n" + "="*70)
print("✂️  STEP 3: Splitting Data (80% train, 20% test)...")
print("="*70)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_encoded, 
    test_size=0.2, 
    random_state=42, 
    stratify=y_encoded
)

print(f"✅ Train set: {X_train.shape[0]:,} samples")
print(f"✅ Test set:  {X_test.shape[0]:,} samples")

# ============================================================================
# STEP 4: TRAIN MULTIPLE MODELS
# ============================================================================
print("\n" + "="*70)
print("🤖 STEP 4: Training Multiple Models...")
print("="*70)

models = {}
results = {}

# Model 1: Random Forest
print(f"\n🌲 Training Random Forest Classifier...")
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1,
    verbose=0
)
rf_model.fit(X_train, y_train)
models['RandomForest'] = rf_model
print(f"   ✅ Random Forest trained")

# Model 2: Gradient Boosting
print(f"\n🚀 Training Gradient Boosting Classifier...")
gb_model = GradientBoostingClassifier(
    n_estimators=100,
    max_depth=10,
    learning_rate=0.1,
    random_state=42,
    verbose=0
)
gb_model.fit(X_train, y_train)
models['GradientBoosting'] = gb_model
print(f"   ✅ Gradient Boosting trained")

# Model 3: XGBoost (if available)
if XGBOOST_AVAILABLE:
    print(f"\n⚡ Training XGBoost Classifier...")
    xgb_model = XGBClassifier(
        n_estimators=100,
        max_depth=10,
        learning_rate=0.1,
        random_state=42,
        n_jobs=-1,
        verbosity=0
    )
    xgb_model.fit(X_train, y_train)
    models['XGBoost'] = xgb_model
    print(f"   ✅ XGBoost trained")

# ============================================================================
# STEP 5: MODEL EVALUATION
# ============================================================================
print("\n" + "="*70)
print("📊 STEP 5: Model Evaluation...")
print("="*70)

for name, model in models.items():
    print(f"\n{'='*70}")
    print(f"🔍 Evaluating: {name}")
    print(f"{'='*70}")
    
    # Predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='macro')
    
    results[name] = {
        'accuracy': accuracy,
        'f1_score': f1,
        'model': model
    }
    
    print(f"\n✅ Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"✅ F1 Score:  {f1:.4f}")
    
    # Feature importances (if available)
    if hasattr(model, 'feature_importances_'):
        print(f"\n🔝 Top 5 Feature Importances:")
        importances = model.feature_importances_
        feature_names = X_encoded.columns
        indices = np.argsort(importances)[::-1][:5]
        
        for i, idx in enumerate(indices, 1):
            print(f"   {i}. {feature_names[idx]}: {importances[idx]:.4f}")
    
    # Confusion Matrix (show first 10x10 for readability)
    print(f"\n📈 Confusion Matrix (first 10x10):")
    cm = confusion_matrix(y_test, y_pred)
    cm_display = cm[:10, :10]
    print(cm_display)

# ============================================================================
# STEP 6: MODEL SELECTION
# ============================================================================
print("\n" + "="*70)
print("🏆 STEP 6: Model Selection...")
print("="*70)

# Find best model based on F1 Score
best_model_name = max(results, key=lambda x: results[x]['f1_score'])
best_model = results[best_model_name]['model']
best_accuracy = results[best_model_name]['accuracy']
best_f1 = results[best_model_name]['f1_score']

print(f"\n🎯 Best Model: {best_model_name}")
print(f"   Accuracy:  {best_accuracy:.4f} ({best_accuracy*100:.2f}%)")
print(f"   F1 Score:  {best_f1:.4f}")

# Compare all models
print(f"\n📊 Model Comparison:")
print(f"{'Model':<20} {'Accuracy':<12} {'F1 Score':<12}")
print("-" * 44)
for name, res in results.items():
    marker = "👑" if name == best_model_name else "  "
    print(f"{marker} {name:<18} {res['accuracy']:.4f}       {res['f1_score']:.4f}")

# Save best model
print(f"\n💾 Saving best model and preprocessing artifacts...")
model_path = "crop_model.pkl"
preprocessing_path = "preprocessing.pkl"

with open(model_path, 'wb') as f:
    pickle.dump(best_model, f)
print(f"   ✅ Model saved: {model_path}")

preprocessing_data = {
    'scaler': scaler,
    'label_encoder': label_encoder,
    'feature_columns': list(X_encoded.columns),
    'crop_classes': list(label_encoder.classes_),
    'season_columns': [col for col in X_encoded.columns if col.startswith('season_')],
    'soil_columns': [col for col in X_encoded.columns if col.startswith('soil_')]
}

with open(preprocessing_path, 'wb') as f:
    pickle.dump(preprocessing_data, f)
print(f"   ✅ Preprocessing saved: {preprocessing_path}")

# ============================================================================
# STEP 7: DETAILED CLASSIFICATION REPORT
# ============================================================================
print("\n" + "="*70)
print("📋 STEP 7: Detailed Classification Report (Best Model)")
print("="*70)

y_pred_best = best_model.predict(X_test)
report = classification_report(
    y_test, y_pred_best, 
    target_names=label_encoder.classes_,
    digits=4
)
print(report)

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "="*70)
print("✅ TRAINING COMPLETE!")
print("="*70)
print(f"\n📦 Saved Artifacts:")
print(f"   1. {model_path} - Best trained model ({best_model_name})")
print(f"   2. {preprocessing_path} - Scaler, encoders, feature info")
print(f"\n🎯 Model Performance:")
print(f"   • Algorithm: {best_model_name}")
print(f"   • Accuracy: {best_accuracy*100:.2f}%")
print(f"   • F1 Score: {best_f1:.4f}")
print(f"   • Crop Classes: {len(label_encoder.classes_)}")
print(f"\n🚀 Next Steps:")
print(f"   1. Use 'predict_crop.py' for making predictions")
print(f"   2. Integrate model into API endpoint")
print(f"   3. Deploy to production environment")
print("\n" + "="*70)
