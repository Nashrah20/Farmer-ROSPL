"""
Example usage of the Crop Prediction System
Demonstrates various ways to use the trained model
"""

from predict_crop import CropPredictor, predict_crop
import json

print("="*70)
print("🌾 CROP PREDICTION SYSTEM - USAGE EXAMPLES")
print("="*70)

# ============================================================================
# METHOD 1: Using CropPredictor class (recommended for multiple predictions)
# ============================================================================
print("\n📌 METHOD 1: Using CropPredictor Class")
print("-"*70)

# Initialize predictor once
predictor = CropPredictor()

# Example 1: Predict for rice conditions (Kharif season)
print("\n🌾 Example 1: Rice Growing Conditions")
rice_result = predictor.predict_crop(
    air_temp=32.5,      # Hot climate
    humidity=85.0,      # High humidity
    soil_moisture=75.0, # Wet soil
    soil_temp=30.0,     # Warm soil
    nitrogen=140.0,     # High N
    phosphorus=55.0,    # Moderate P
    potassium=85.0,     # Moderate K
    season='kharif'     # Monsoon season
)

print(json.dumps(rice_result, indent=2))

# Example 2: Predict for wheat conditions (Rabi season)
print("\n" + "="*70)
print("\n🌾 Example 2: Wheat Growing Conditions")
wheat_result = predictor.predict_crop(
    air_temp=18.0,      # Cool climate
    humidity=55.0,      # Moderate humidity
    soil_moisture=40.0, # Moderate soil moisture
    soil_temp=15.0,     # Cool soil
    nitrogen=95.0,      # Moderate N
    phosphorus=75.0,    # High P
    potassium=65.0,     # Moderate K
    season='rabi'       # Winter season
)

print(json.dumps(wheat_result, indent=2))

# Example 3: Predict for summer crop (Zaid season)
print("\n" + "="*70)
print("\n🌾 Example 3: Summer Crop Conditions")
summer_result = predictor.predict_crop(
    air_temp=35.0,      # Very hot
    humidity=40.0,      # Low humidity
    soil_moisture=45.0, # Moderate moisture
    soil_temp=32.0,     # Hot soil
    nitrogen=80.0,      # Moderate N
    phosphorus=60.0,    # Moderate P
    potassium=95.0,     # High K
    season='zaid'       # Summer season
)

print(json.dumps(summer_result, indent=2))

# ============================================================================
# METHOD 2: Using convenience function (for single predictions)
# ============================================================================
print("\n" + "="*70)
print("\n📌 METHOD 2: Using Convenience Function")
print("-"*70)

result = predict_crop(
    air_temp=25.0,
    humidity=65.0,
    soil_moisture=50.0,
    soil_temp=22.0,
    nitrogen=100.0,
    phosphorus=65.0,
    potassium=70.0,
    season='kharif'
)

print(f"\n🎯 Best Crop: {result['predicted_crop']}")
print(f"✅ Confidence: {result['confidence_percent']}")
print(f"\n📊 Top 3 Recommendations:")
for i, crop in enumerate(result['top_3_crops'], 1):
    print(f"   {i}. {crop['crop']:<15} - {crop['confidence_percent']}")

# ============================================================================
# METHOD 3: Batch predictions
# ============================================================================
print("\n" + "="*70)
print("\n📌 METHOD 3: Batch Predictions")
print("-"*70)

batch_inputs = [
    {
        'air_temp': 30.0, 'humidity': 70.0, 'soil_moisture': 60.0,
        'soil_temp': 28.0, 'nitrogen': 120.0, 'phosphorus': 55.0,
        'potassium': 80.0, 'season': 'kharif'
    },
    {
        'air_temp': 22.0, 'humidity': 60.0, 'soil_moisture': 45.0,
        'soil_temp': 18.0, 'nitrogen': 100.0, 'phosphorus': 70.0,
        'potassium': 65.0, 'season': 'rabi'
    },
    {
        'air_temp': 33.0, 'humidity': 45.0, 'soil_moisture': 50.0,
        'soil_temp': 30.0, 'nitrogen': 85.0, 'phosphorus': 58.0,
        'potassium': 90.0, 'season': 'zaid'
    }
]

batch_results = predictor.predict_batch(batch_inputs)

for i, result in enumerate(batch_results, 1):
    print(f"\n🌱 Field {i}: {result['predicted_crop']} ({result['confidence_percent']})")
    print(f"   Season: {result['input_summary']['season']}")

# ============================================================================
# METHOD 4: Real-time sensor data simulation
# ============================================================================
print("\n" + "="*70)
print("\n📌 METHOD 4: Real-time Sensor Simulation")
print("-"*70)

# Simulating live sensor readings
live_sensors = {
    'air_temp': 23.3,       # From Weather API
    'humidity': 61.0,       # From Weather API
    'soil_moisture': 11.0,  # From Soil API
    'soil_temp': 21.9,      # From Soil API
    'nitrogen': 86.20,      # From NPK API
    'phosphorus': 32.90,    # From NPK API
    'potassium': 191.10,    # From NPK API
    'season': 'rabi'        # Current season (Jan-Feb)
}

print("\n📡 Live Sensor Data:")
for key, value in live_sensors.items():
    print(f"   {key}: {value}")

live_result = predictor.predict_crop(**live_sensors)

print(f"\n🎯 Recommended Crop: {live_result['predicted_crop']}")
print(f"✅ Confidence: {live_result['confidence_percent']}")
print(f"\n🏆 Alternative Options:")
for i, crop in enumerate(live_result['top_3_crops'][1:], 2):
    print(f"   {i}. {crop['crop']}: {crop['confidence_percent']}")

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "="*70)
print("✅ ALL EXAMPLES COMPLETED!")
print("="*70)
print("\n💡 Integration Tips:")
print("   1. Use CropPredictor class for API endpoints")
print("   2. Store predictor instance globally to avoid reloading")
print("   3. Batch predictions for efficiency")
print("   4. Add error handling for invalid inputs")
print("   5. Log predictions for analytics")
print("\n🚀 Ready for API integration!")
print("="*70)
