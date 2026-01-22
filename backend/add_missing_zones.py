"""
Add remaining zones to complete the soil-crop mapping:
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

def generate_sensor_reading(zone_id, timestamp):
    """Generate a realistic sensor reading"""
    return {
        'zone_id': zone_id,
        'timestamp': timestamp,
        'soil_moisture_pct': random.uniform(20, 80),
        'N_mgkg': random.uniform(100, 300),
        'P_mgkg': random.uniform(10, 30),
        'K_mgkg': random.uniform(100, 250),
        'ph': random.uniform(6.0, 7.5),
        'EC_ds_m': random.uniform(0.5, 2.5),
        'NDVI': random.uniform(0.3, 0.9),
        'leaf_health_score': random.uniform(60, 95),
        'stress_level': random.uniform(0, 8)
    }

def generate_weather(zone_id, timestamp):
    """Generate realistic weather data"""
    return {
        'zone_id': zone_id,
        'timestamp': timestamp,
        'air_temp_c': random.uniform(15, 35),
        'humidity_pct': random.uniform(40, 80),
        'wind_kmph': random.uniform(5, 25),
        'rainfall_mm': random.uniform(0, 20)
    }

def generate_action(zone_id, timestamp):
    """Generate an action record"""
    return {
        'zone_id': zone_id,
        'timestamp': timestamp,
        'irrigation_liters': random.uniform(200, 800),
        'fertilizer_N_g': random.uniform(50, 200),
        'fertilizer_P_g': random.uniform(20, 80),
        'fertilizer_K_g': random.uniform(50, 180)
    }

def add_missing_zones():
    """Add missing crop zones to complete the mapping"""
    print("Connecting to MongoDB...")
    client = MongoClient(Config.MONGODB_URI)
    db = client[Config.MONGODB_DATABASE]
    
    # Get existing zones
    existing_zones = db.sensorReadings.distinct('zone_id')
    print(f"\nExisting zones: {sorted(existing_zones)}")
    
    # Define missing zones based on your specification
    missing_zones = [
        'Coarse_Groundnut',
        'Coarse_Watermelon',
        'Black_Jowar',
        'Laterite_Cashew',
        'Laterite_Coconut',
        'Alluvial_Sugarcane',
        'Alluvial_Banana',
        'YellowBrown_Rice',
        'YellowBrown_Ragi',
        'YellowBrown_Tur'
    ]
    
    # Filter out zones that already exist
    zones_to_add = [z for z in missing_zones if z not in existing_zones]
    
    if not zones_to_add:
        print("\n✓ All zones already exist!")
        return
    
    print(f"\nZones to add: {zones_to_add}")
    print(f"Total new zones: {len(zones_to_add)}")
    
    # Generate data for missing zones (30 days, hourly readings)
    days = 30
    readings_per_day = 24
    
    sensor_readings = []
    weather_data = []
    actions_data = []
    
    for zone_id in zones_to_add:
        print(f"Generating data for: {zone_id}")
        
        for day in range(days):
            for hour in range(readings_per_day):
                timestamp = datetime.now() - timedelta(days=days-day, hours=readings_per_day-hour)
                
                sensor_readings.append(generate_sensor_reading(zone_id, timestamp))
                weather_data.append(generate_weather(zone_id, timestamp))
                
                # Generate actions less frequently (once per day at noon)
                if hour == 12:
                    actions_data.append(generate_action(zone_id, timestamp))
    
    # Insert data
    print(f"\nInserting {len(sensor_readings)} sensor readings...")
    db.sensorReadings.insert_many(sensor_readings)
    
    print(f"Inserting {len(weather_data)} weather records...")
    db.weather.insert_many(weather_data)
    
    print(f"Inserting {len(actions_data)} action records...")
    db.actions.insert_many(actions_data)
    
    # Verify all zones
    print("\n" + "="*60)
    print("FINAL ZONE LIST:")
    print("="*60)
    all_zones = db.sensorReadings.distinct('zone_id')
    for zone in sorted(all_zones):
        count = db.sensorReadings.count_documents({'zone_id': zone})
        print(f"  {zone:25} {count:5} readings")
    
    print(f"\n✓ Complete! Total zones: {len(all_zones)}")
    print(f"Total sensor readings: {db.sensorReadings.count_documents({})}")
    
    client.close()

if __name__ == "__main__":
    add_missing_zones()
