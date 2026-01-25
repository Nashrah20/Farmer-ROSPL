"""
Debug script to check the actual one-hot encoded features
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from predict_crop import CropPredictor
import pandas as pd
import numpy as np

print("="*70)
print("🔍 DEBUGGING ONE-HOT ENCODING")
print("="*70)

# Initialize predictor
predictor = CropPredictor()

# Test parameters
test_params = {
    'air_temp': 28.0,
    'humidity': 65.0,
    'soil_moisture': 50.0,
    'soil_temp': 26.0,
    'nitrogen': 120.0,
    'phosphorus': 85.0,
    'potassium': 95.0,
    'season': 'rabi'
}

soil_types = ['black_soil', 'red_soil', 'laterite_soil', 'alluvial_soil', 'saline_alkaline_soil']

print(f"\n📋 Feature columns: {len(predictor.feature_columns)}")
print(f"   Soil columns: {[col for col in predictor.feature_columns if 'soil' in col and col not in ['soil_moisture (%)', 'soil_temp (°C)']]}")

print("\n" + "="*70)
print("Checking one-hot encoding for each soil type:")
print("="*70)

for soil_type in soil_types:
    print(f"\n🌱 Testing: {soil_type}")
    print("-" * 50)
    
    # Call the preprocess function to see what gets encoded
    input_scaled = predictor._preprocess_input(
        **test_params,
        soil_type=soil_type
    )
    
    # Get the feature names and their values
    soil_feature_cols = [col for col in predictor.feature_columns if 'soil' in col and col not in ['soil_moisture (%)', 'soil_temp (°C)']]
    soil_feature_indices = [predictor.feature_columns.index(col) for col in soil_feature_cols]
    
    # Before scaling, let's manually create the input to see the one-hot encoding
    input_data = pd.DataFrame({
        'air_temp (°C)': [test_params['air_temp']],
        'humidity (%)': [test_params['humidity']],
        'soil_moisture (%)': [test_params['soil_moisture']],
        'soil_temp (°C)': [test_params['soil_temp']],
        'nitrogen (mg/kg)': [test_params['nitrogen']],
        'phosphorus (mg/kg)': [test_params['phosphorus']],
        'potassium (mg/kg)': [test_params['potassium']]
    })
    
    # One-hot encode season
    for season_col in predictor.season_columns:
        season_name = season_col.replace('season_', '')
        input_data[season_col] = 1 if test_params['season'].lower() == season_name.lower() else 0
    
    # One-hot encode soil type
    print("   Soil type encoding:")
    for soil_col in predictor.soil_columns:
        if soil_col in ['soil_moisture (%)', 'soil_temp (°C)']:
            continue
        soil_name = soil_col.replace('soil_', '', 1)
        encoded_value = 1 if soil_type.lower() == soil_name.lower() else 0
        input_data[soil_col] = encoded_value
        print(f"     {soil_col:30} = {encoded_value} (comparing '{soil_type}' with '{soil_name}')")
    
    # Check if only one soil column is 1
    soil_one_hot_values = [input_data[col].values[0] for col in soil_feature_cols]
    sum_one_hot = sum(soil_one_hot_values)
    print(f"   Sum of one-hot values: {sum_one_hot} (should be 1)")
    
    if sum_one_hot != 1:
        print(f"   ⚠️ WARNING: Expected exactly one '1' in soil one-hot encoding, got {sum_one_hot}")
    else:
        active_col = [col for col, val in zip(soil_feature_cols, soil_one_hot_values) if val == 1]
        print(f"   ✅ Active column: {active_col[0] if active_col else 'NONE'}")

print("\n" + "="*70)
