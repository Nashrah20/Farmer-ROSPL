"""
Test script to verify soil type one-hot encoding is working correctly
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from predict_crop import CropPredictor
import numpy as np

print("="*70)
print("🧪 TESTING SOIL TYPE DIFFERENTIATION")
print("="*70)

# Initialize predictor
try:
    predictor = CropPredictor()
    print("\n✅ Predictor loaded successfully")
    print(f"   Soil columns available: {predictor.soil_columns}")
except Exception as e:
    print(f"❌ Error loading predictor: {e}")
    exit(1)

# Test parameters (keeping everything constant except soil type)
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

# Test different soil types
soil_types = [
    'black_soil',
    'red_soil', 
    'laterite_soil',
    'alluvial_soil',
    'saline_alkaline_soil'
]

print("\n" + "="*70)
print("Testing predictions for different soil types:")
print("="*70)

results = {}
for soil_type in soil_types:
    try:
        print(f"\n🌱 Soil Type: {soil_type}")
        print("-" * 50)
        
        prediction = predictor.predict_crop(
            **test_params,
            soil_type=soil_type
        )
        
        results[soil_type] = prediction
        
        print(f"   Predicted Crop: {prediction['predicted_crop']}")
        print(f"   Confidence: {prediction['confidence_percent']}")
        print(f"   Top 3 Crops:")
        for i, crop_info in enumerate(prediction['top_3_crops'][:3], 1):
            print(f"      {i}. {crop_info['crop']}: {crop_info['probability']*100:.2f}%")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()

# Check if predictions are different
print("\n" + "="*70)
print("VERIFICATION: Are predictions different for different soil types?")
print("="*70)

predicted_crops = [results[st]['predicted_crop'] for st in soil_types if st in results]
unique_predictions = len(set(predicted_crops))

print(f"\nTotal soil types tested: {len(soil_types)}")
print(f"Unique crop predictions: {unique_predictions}")

if unique_predictions == 1:
    print("\n❌ PROBLEM: All soil types giving the same prediction!")
    print(f"   All predicted: {predicted_crops[0]}")
elif unique_predictions == len(soil_types):
    print("\n✅ EXCELLENT: Each soil type gives a different prediction!")
else:
    print(f"\n✓ GOOD: Got {unique_predictions} different predictions for {len(soil_types)} soil types")

print("\nPrediction Summary:")
for st, crop in zip(soil_types, predicted_crops):
    print(f"  {st:25} -> {crop}")

print("\n" + "="*70)
