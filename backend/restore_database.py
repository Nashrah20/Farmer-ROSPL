"""
Restore database with proper soil-crop mapping and all fields
Coarse → Groundnut, Bajra, Watermelon
Black → Cotton, Soybean, Jowar
Laterite → Cashew, Coconut, Rice
Alluvial → Sugarcane, Wheat, Banana
YellowBrown → Rice, Ragi, Tur
"""

from pymongo import MongoClient
from datetime import datetime, timedelta
import random
from config import Config

# Soil-Crop-Region mapping
ZONES_CONFIG = [
    # Coarse soil
    {'zone_id': 'CS1', 'soil_type': 'coarse', 'crop': 'groundnut', 'region': 'NorthMaha'},
    {'zone_id': 'CS2', 'soil_type': 'coarse', 'crop': 'bajra', 'region': 'WestMaha'},
    {'zone_id': 'CS3', 'soil_type': 'coarse', 'crop': 'watermelon', 'region': 'Vidarbha'},
    
    # Black soil
    {'zone_id': 'BS1', 'soil_type': 'black', 'crop': 'cotton', 'region': 'Vidarbha'},
    {'zone_id': 'BS2', 'soil_type': 'black', 'crop': 'soybean', 'region': 'WestMaha'},
    {'zone_id': 'BS3', 'soil_type': 'black', 'crop': 'jowar', 'region': 'NorthMaha'},
    
    # Laterite soil
    {'zone_id': 'LS1', 'soil_type': 'laterite', 'crop': 'cashew', 'region': 'Konkan'},
    {'zone_id': 'LS2', 'soil_type': 'laterite', 'crop': 'coconut', 'region': 'Konkan'},
    {'zone_id': 'LS3', 'soil_type': 'laterite', 'crop': 'rice', 'region': 'Konkan'},
    
    # Alluvial soil
    {'zone_id': 'AS1', 'soil_type': 'alluvial', 'crop': 'sugarcane', 'region': 'WestMaha'},
    {'zone_id': 'AS2', 'soil_type': 'alluvial', 'crop': 'wheat', 'region': 'NorthMaha'},
    {'zone_id': 'AS3', 'soil_type': 'alluvial', 'crop': 'banana', 'region': 'WestMaha'},
    
    # Yellow-Brown soil
    {'zone_id': 'YS1', 'soil_type': 'yellow-brown', 'crop': 'rice', 'region': 'Konkan'},
    {'zone_id': 'YS2', 'soil_type': 'yellow-brown', 'crop': 'ragi', 'region': 'Vidarbha'},
    {'zone_id': 'YS3', 'soil_type': 'yellow-brown', 'crop': 'tur', 'region': 'NorthMaha'},
]

def generate_sensor_reading(zone_config, timestamp):
    """Generate realistic sensor reading with all fields"""
    return {
        'zone_id': zone_config['zone_id'],
        'soil_type': zone_config['soil_type'],
        'crop': zone_config['crop'],
        'region': zone_config['region'],
        'crop_stage': random.choice(['sowing', 'vegetative', 'flowering', 'maturity']),
        'area_acre': random.randint(1, 5),
        'timestamp': timestamp,
        'soil_moisture_pct': round(random.uniform(20, 80), 2),
        'soil_temp_c': round(random.uniform(18, 32), 2),
        'air_temp_c': round(random.uniform(15, 40), 2),
        'humidity_pct': round(random.uniform(30, 90), 1),
        'wind_kmph': round(random.uniform(2, 20), 1),
        'rainfall_mm': round(random.uniform(0, 25), 1),
        'ph': round(random.uniform(5.5, 8.5), 2),
        'EC_ds_m': round(random.uniform(0.3, 3.0), 2),
        'N_mgkg': round(random.uniform(50, 300), 1),
        'P_mgkg': round(random.uniform(5, 40), 1),
        'K_mgkg': round(random.uniform(80, 350), 1),
        'NDVI': round(random.uniform(0.2, 0.95), 3),
        'leaf_health_score': round(random.uniform(50, 95), 1),
        'stress_level': random.randint(0, 10)
    }

def generate_weather(zone_config, timestamp):
    """Generate weather data"""
    return {
        'zone_id': zone_config['zone_id'],
        'soil_type': zone_config['soil_type'],
        'crop': zone_config['crop'],
        'region': zone_config['region'],
        'timestamp': timestamp,
        'air_temp_c': round(random.uniform(15, 40), 2),
        'humidity_pct': round(random.uniform(30, 90), 1),
        'wind_kmph': round(random.uniform(2, 20), 1),
        'rainfall_mm': round(random.uniform(0, 25), 1),
        'pressure_mb': round(random.uniform(990, 1020), 1)
    }

def generate_action(zone_config, timestamp):
    """Generate action record"""
    return {
        'zone_id': zone_config['zone_id'],
        'soil_type': zone_config['soil_type'],
        'crop': zone_config['crop'],
        'region': zone_config['region'],
        'timestamp': timestamp,
        'irrigation_liters': round(random.uniform(200, 1000), 1),
        'fertilizer_N_g': round(random.uniform(50, 250), 1),
        'fertilizer_P_g': round(random.uniform(20, 100), 1),
        'fertilizer_K_g': round(random.uniform(50, 200), 1)
    }

def restore_database():
    """Restore database with complete data"""
    print("="*70)
    print("DATABASE RESTORATION")
    print("="*70)
    
    client = MongoClient(Config.MONGODB_URI)
    db = client[Config.MONGODB_DATABASE]
    
    # Clear existing data
    print("\nClearing existing data...")
    db.sensorReadings.delete_many({})
    db.weather.delete_many({})
    db.actions.delete_many({})
    print("✓ Collections cleared")
    
    # Generate data - 120 days of data to get ~43K readings
    days = 120
    readings_per_day = 24  # Hourly
    
    print(f"\nGenerating data:")
    print(f"  Zones: {len(ZONES_CONFIG)}")
    print(f"  Days: {days}")
    print(f"  Readings per day: {readings_per_day}")
    print(f"  Expected total: ~{len(ZONES_CONFIG) * days * readings_per_day:,} readings")
    
    # Generate data for each zone
    # Calculate start time: 120 days ago, at hour 0 (local time, not UTC)
    from datetime import timezone, timedelta as td
    
    # Get current local time without timezone info
    end_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(days=days)
    
    print(f"\nData time range (Local Time):")
    print(f"  Start: {start_time}")
    print(f"  End: {end_time}")
    
    sensor_readings = []
    weather_data = []
    actions_data = []
    
    for zone_config in ZONES_CONFIG:
        print(f"\nGenerating: {zone_config['zone_id']} ({zone_config['soil_type']} - {zone_config['crop']})")
        
        current_time = start_time
        while current_time <= end_time:
            sensor_readings.append(generate_sensor_reading(zone_config, current_time))
            weather_data.append(generate_weather(zone_config, current_time))
            
            # Actions once per day at noon
            if current_time.hour == 12:
                actions_data.append(generate_action(zone_config, current_time))
            
            current_time += timedelta(hours=1)
    
    # Insert in batches
    print(f"\n\nInserting {len(sensor_readings):,} sensor readings...")
    db.sensorReadings.insert_many(sensor_readings)
    
    print(f"Inserting {len(weather_data):,} weather records...")
    db.weather.insert_many(weather_data)
    
    print(f"Inserting {len(actions_data):,} action records...")
    db.actions.insert_many(actions_data)
    
    # Verify
    print("\n" + "="*70)
    print("VERIFICATION - Zones in Database:")
    print("="*70)
    print(f"{'Zone ID':<10} | {'Soil':<15} | {'Crop':<15} | {'Region':<15} | {'Count'}")
    print("-"*70)
    
    for zone_config in ZONES_CONFIG:
        count = db.sensorReadings.count_documents({'zone_id': zone_config['zone_id']})
        print(f"{zone_config['zone_id']:<10} | {zone_config['soil_type']:<15} | {zone_config['crop']:<15} | {zone_config['region']:<15} | {count:>5}")
    
    total = db.sensorReadings.count_documents({})
    print("="*70)
    print(f"✓ Restoration complete!")
    print(f"  Total zones: {len(ZONES_CONFIG)}")
    print(f"  Total sensor readings: {total:,}")
    print(f"  Total weather records: {db.weather.count_documents({}):,}")
    print(f"  Total actions: {db.actions.count_documents({}):,}")
    
    client.close()

if __name__ == "__main__":
    restore_database()
