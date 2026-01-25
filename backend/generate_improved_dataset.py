"""
Generate an improved crop dataset with realistic soil-crop relationships
This ensures the model learns proper soil type importance
"""

import pandas as pd
import numpy as np
from itertools import product

np.random.seed(42)

print("="*80)
print("🌾 GENERATING IMPROVED SOIL-AWARE CROP DATASET")
print("="*80)

# Define realistic crop preferences for each soil type (based on agricultural knowledge)
# Using more aggressive distributions for better soil-crop learning
SOIL_CROP_PREFERENCES = {
    'black_soil': {
        'primary': ['cotton', 'soybean', 'wheat', 'gram'],  # 75% of data
        'secondary': ['maize', 'onion'],  # 20% of data
        'rare': ['rice', 'bajra', 'sugarcane', 'pomegranate']  # 5% of data
    },
    'red_soil': {
        'primary': ['gram', 'bajra', 'maize'],  # 75%
        'secondary': ['cotton', 'wheat'],  # 20%
        'rare': ['rice', 'sugarcane', 'onion', 'soybean', 'pomegranate']  # 5%
    },
    'laterite_soil': {
        'primary': ['rice', 'bajra'],  # 75%
        'secondary': ['maize'],  # 20%
        'rare': ['cotton', 'wheat', 'soybean', 'gram', 'sugarcane', 'onion', 'pomegranate']  # 5%
    },
    'alluvial_soil': {
        'primary': ['rice', 'sugarcane', 'wheat', 'maize'],  # 75%
        'secondary': ['cotton', 'soybean'],  # 20%
        'rare': ['bajra', 'pomegranate', 'gram', 'onion']  # 5%
    },
    'saline_alkaline_soil': {
        'primary': ['bajra', 'soybean', 'maize'],  # 75%
        'secondary': ['wheat', 'cotton'],  # 20%
        'rare': ['rice', 'sugarcane', 'gram', 'onion', 'pomegranate']  # 5%
    }
}

# Available crops in the model
AVAILABLE_CROPS = ['bajra', 'cotton', 'gram', 'maize', 'onion', 'pomegranate', 'rice', 'soybean', 'sugarcane', 'wheat']

# Seasons
SEASONS = ['kharif', 'rabi', 'zaid']

# Environmental parameter ranges for each crop
CROP_PARAMS = {
    'rice': {'temp': (25, 35), 'humidity': (70, 90), 'moisture': (60, 80), 'N': (100, 150), 'P': (40, 70), 'K': (40, 60)},
    'wheat': {'temp': (15, 25), 'humidity': (50, 70), 'moisture': (40, 60), 'N': (100, 140), 'P': (50, 80), 'K': (60, 90)},
    'cotton': {'temp': (22, 32), 'humidity': (50, 80), 'moisture': (45, 70), 'N': (80, 120), 'P': (40, 60), 'K': (80, 120)},
    'sugarcane': {'temp': (25, 35), 'humidity': (70, 90), 'moisture': (60, 85), 'N': (150, 200), 'P': (60, 90), 'K': (100, 150)},
    'maize': {'temp': (20, 30), 'humidity': (60, 80), 'moisture': (50, 70), 'N': (90, 130), 'P': (40, 70), 'K': (70, 100)},
    'gram': {'temp': (18, 28), 'humidity': (50, 70), 'moisture': (35, 55), 'N': (60, 90), 'P': (40, 60), 'K': (50, 70)},
    'bajra': {'temp': (25, 35), 'humidity': (40, 60), 'moisture': (30, 50), 'N': (60, 100), 'P': (30, 50), 'K': (40, 60)},
    'soybean': {'temp': (20, 30), 'humidity': (60, 80), 'moisture': (45, 65), 'N': (70, 110), 'P': (50, 80), 'K': (70, 100)},
    'onion': {'temp': (15, 25), 'humidity': (60, 75), 'moisture': (50, 70), 'N': (80, 120), 'P': (40, 60), 'K': (80, 110)},
    'pomegranate': {'temp': (20, 30), 'humidity': (40, 60), 'moisture': (40, 60), 'N': (70, 110), 'P': (50, 80), 'K': (90, 130)}
}

def generate_sample(crop, soil_type, season):
    """Generate a single data sample with realistic parameters"""
    params = CROP_PARAMS.get(crop, CROP_PARAMS['wheat'])
    
    # Add some variation
    air_temp = np.random.uniform(*params['temp'])
    humidity = np.random.uniform(*params['humidity'])
    soil_moisture = np.random.uniform(*params['moisture'])
    soil_temp = air_temp - np.random.uniform(1, 4)  # Soil slightly cooler
    nitrogen = np.random.uniform(*params['N'])
    phosphorus = np.random.uniform(*params['P'])
    potassium = np.random.uniform(*params['K'])
    
    return {
        'soil_type': soil_type,
        'air_temp (°C)': round(air_temp, 1),
        'humidity (%)': round(humidity, 1),
        'soil_moisture (%)': round(soil_moisture, 1),
        'soil_temp (°C)': round(soil_temp, 1),
        'nitrogen (mg/kg)': round(nitrogen, 1),
        'phosphorus (mg/kg)': round(phosphorus, 1),
        'potassium (mg/kg)': round(potassium, 1),
        'season': season,
        'crop': crop
    }

# Generate dataset
print("\n📊 Generating samples with realistic soil-crop distributions...")
samples = []
samples_per_soil = 20000  # 100k total / 5 soil types

for soil_type in SOIL_CROP_PREFERENCES.keys():
    prefs = SOIL_CROP_PREFERENCES[soil_type]
    
    # Filter crops to only those available in the model
    primary_crops = [c for c in prefs['primary'] if c in AVAILABLE_CROPS]
    secondary_crops = [c for c in prefs['secondary'] if c in AVAILABLE_CROPS]
    rare_crops = [c for c in prefs['rare'] if c in AVAILABLE_CROPS]
    
    # Calculate sample counts (75%-20%-5% distribution)
    primary_count = int(samples_per_soil * 0.75)  # 75% primary (highly suitable)
    secondary_count = int(samples_per_soil * 0.20)  # 20% secondary (moderately suitable)
    rare_count = samples_per_soil - primary_count - secondary_count  # 5% rare (low suitability)
    
    print(f"\n🌱 {soil_type}:")
    print(f"   Primary ({len(primary_crops)} crops): {primary_count} samples (75%)")
    print(f"   Secondary ({len(secondary_crops)} crops): {secondary_count} samples (20%)")
    print(f"   Rare ({len(rare_crops)} crops): {rare_count} samples (5%)")
    
    # Generate samples for primary crops
    if primary_crops:
        crops_primary = np.random.choice(primary_crops, size=primary_count)
        for crop in crops_primary:
            season = np.random.choice(SEASONS)
            samples.append(generate_sample(crop, soil_type, season))
    
    # Generate samples for secondary crops
    if secondary_crops:
        crops_secondary = np.random.choice(secondary_crops, size=secondary_count)
        for crop in crops_secondary:
            season = np.random.choice(SEASONS)
            samples.append(generate_sample(crop, soil_type, season))
    
    # Generate samples for rare crops
    if rare_crops:
        crops_rare = np.random.choice(rare_crops, size=rare_count)
        for crop in crops_rare:
            season = np.random.choice(SEASONS)
            samples.append(generate_sample(crop, soil_type, season))

# Create DataFrame
df = pd.DataFrame(samples)

# Shuffle the dataset
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print("\n" + "="*80)
print("📈 DATASET STATISTICS")
print("="*80)
print(f"\nTotal samples: {len(df):,}")
print(f"Unique crops: {df['crop'].nunique()}")
print(f"Unique soil types: {df['soil_type'].nunique()}")

print("\n📊 Soil Type Distribution:")
print(df['soil_type'].value_counts())

print("\n🌾 Crop Distribution by Soil Type:")
for soil in df['soil_type'].unique():
    soil_df = df[df['soil_type'] == soil]
    print(f"\n{soil} ({len(soil_df):,} samples):")
    top_crops = soil_df['crop'].value_counts().head(5)
    for crop, count in top_crops.items():
        pct = (count / len(soil_df)) * 100
        print(f"   {crop:15} {count:5,} ({pct:5.1f}%)")

# Save the dataset
output_path = 'Data/maharashtra_5_soil_types_improved_100k.csv'
df.to_csv(output_path, index=False)
print(f"\n✅ Dataset saved to: {output_path}")

print("\n" + "="*80)
print("✅ IMPROVED DATASET GENERATION COMPLETE!")
print("="*80)
print("\nKey improvements:")
print("  ✅ 75% primary crops (highly suitable for soil type) - AGGRESSIVE")
print("  ✅ 20% secondary crops (moderately suitable)")
print("  ✅ 5% rare crops (less suitable)")
print("  ✅ Strong soil-crop relationships for better model learning!")
print("  ✅ Model will learn that soil type MATTERS!")
print("="*80)
