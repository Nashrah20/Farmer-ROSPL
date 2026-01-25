"""
Check feature importance in the trained model
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pickle
import numpy as np
import pandas as pd

print("="*70)
print("📊 FEATURE IMPORTANCE ANALYSIS")
print("="*70)

# Load the model and preprocessing
with open('crop_model.pkl', 'rb') as f:
    model = pickle.load(f)

with open('preprocessing.pkl', 'rb') as f:
    preprocessing = pickle.load(f)

feature_columns = preprocessing['feature_columns']

print(f"\n🤖 Model type: {type(model).__name__}")

# Check if model has feature importance
if hasattr(model, 'feature_importances_'):
    importances = model.feature_importances_
    
    # Create a DataFrame for easy sorting
    feature_importance_df = pd.DataFrame({
        'feature': feature_columns,
        'importance': importances
    }).sort_values('importance', ascending=False)
    
    print(f"\n📈 Feature Importance (Top 15):")
    print("="*70)
    for idx, row in feature_importance_df.head(15).iterrows():
        bar_length = int(row['importance'] * 100)
        bar = '█' * bar_length
        print(f"{row['feature']:30} {row['importance']:6.4f} {bar}")
    
    # Specifically check soil type features
    print(f"\n🌱 Soil Type Feature Importance:")
    print("="*70)
    soil_features = feature_importance_df[feature_importance_df['feature'].str.contains('soil_') & 
                                          ~feature_importance_df['feature'].isin(['soil_moisture (%)', 'soil_temp (°C)'])]
    for idx, row in soil_features.iterrows():
        bar_length = int(row['importance'] * 100)
        bar = '█' * bar_length if bar_length > 0 else '▁'
        print(f"{row['feature']:30} {row['importance']:6.4f} {bar}")
    
    soil_importance_sum = soil_features['importance'].sum()
    print(f"\n📊 Total soil type importance: {soil_importance_sum:.4f} ({soil_importance_sum*100:.2f}%)")
    
    if soil_importance_sum < 0.05:
        print("⚠️  WARNING: Soil type features have very low importance!")
        print("   This means the model doesn't heavily rely on soil type for predictions.")
        print("   The model may need to be retrained with more diverse soil-crop combinations.")
    
else:
    print("\n⚠️  Model doesn't have feature_importances_ attribute")
    print("   (This is normal for some model types like SVM)")

# Check training data distribution
print("\n" + "="*70)
print("📂 CHECKING TRAINING DATA DISTRIBUTION")
print("="*70)

try:
    df = pd.read_csv('Data/maharashtra_5_soil_types_crop_dataset_100k.csv')
    
    print(f"\nTotal samples: {len(df):,}")
    print(f"Unique crops: {df['crop'].nunique()}")
    print(f"Unique soil types: {df['soil_type'].nunique()}")
    
    # Check crop distribution per soil type
    print(f"\n📊 Crop-Soil Type Combinations:")
    print("="*70)
    
    crop_soil_dist = df.groupby(['soil_type', 'crop']).size().reset_index(name='count')
    
    for soil in df['soil_type'].unique():
        soil_data = crop_soil_dist[crop_soil_dist['soil_type'] == soil].sort_values('count', ascending=False)
        print(f"\n{soil}:")
        top_crops = soil_data.head(5)
        for _, row in top_crops.iterrows():
            pct = (row['count'] / len(df[df['soil_type'] == soil])) * 100
            print(f"   {row['crop']:20} {row['count']:6,} samples ({pct:5.1f}%)")
    
    # Check if all soil types have similar crop distributions
    print(f"\n" + "="*70)
    print("🔍 DIAGNOSIS:")
    print("="*70)
    
    # Get top crop for each soil type
    top_crops_per_soil = {}
    for soil in df['soil_type'].unique():
        soil_data = df[df['soil_type'] == soil]
        top_crop = soil_data['crop'].value_counts().idxmax()
        top_pct = (soil_data['crop'].value_counts().max() / len(soil_data)) * 100
        top_crops_per_soil[soil] = (top_crop, top_pct)
    
    print("\nMost common crop per soil type:")
    for soil, (crop, pct) in top_crops_per_soil.items():
        print(f"   {soil:25} -> {crop:15} ({pct:.1f}%)")
    
    unique_top_crops = set([crop for crop, pct in top_crops_per_soil.values()])
    if len(unique_top_crops) == 1:
        print(f"\n❌ PROBLEM IDENTIFIED: All soil types have the same dominant crop ({list(unique_top_crops)[0]})")
        print("   The training data doesn't have enough diversity in crop-soil combinations.")
        print("   This is why the model predicts the same crop regardless of soil type.")
    else:
        print(f"\n✓ Training data has {len(unique_top_crops)} different top crops across soil types")
        
except Exception as e:
    print(f"❌ Error loading training data: {e}")

print("\n" + "="*70)
