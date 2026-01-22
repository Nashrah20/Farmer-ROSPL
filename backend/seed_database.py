"""
Database Seeding Script (Optional)

This script can be used to seed the database with sample data if needed.
"""

from pymongo import MongoClient
from datetime import datetime, timedelta
import random
from config import Config

# Configuration from .env
MONGODB_URI = Config.MONGODB_URI
DATABASE_NAME = Config.MONGODB_DATABASE

# Zone configurations matching actual MongoDB data
SOIL_CROP_MAPPING = {
    'Coarse': ['Groundnut', 'Bajra', 'Watermelon'],
    'Black': ['Cotton', 'Soybean', 'Jowar'],
    'Laterite': ['Cashew', 'Coconut', 'Rice'],
    'Alluvial': ['Sugarcane', 'Wheat', 'Banana'],
    'YellowBrown': ['Rice', 'Ragi', 'Tur']
}

def generate_zone_id(soil_type, crop):
    """Generate zone ID from soil type and crop"""
    return f"{soil_type}_{crop}"

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

def seed_database():
    """Seed the database with sample data"""
    print("Connecting to MongoDB...")
    client = MongoClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    
    # Clear existing data (optional - comment out to keep existing data)
    print("Clearing existing data...")
    db.sensorReadings.delete_many({})
    db.weather.delete_many({})
    db.actions.delete_many({})
    
    print("Generating sample data...")
    
    # Generate data for each zone based on soil-crop mapping
    zones = []
    for soil, crops in SOIL_CROP_MAPPING.items():
        for crop in crops:
            zones.append(generate_zone_id(soil, crop))
    
    print(f"Creating data for {len(zones)} zones...")
    
    # Generate 30 days of data
    days = 30
    readings_per_day = 24  # Hourly readings
    
    sensor_readings = []
    weather_data = []
    actions_data = []
    
    for zone_id in zones:
        print(f"Generating data for zone: {zone_id}")
        
        for day in range(days):
            for hour in range(readings_per_day):
                timestamp = datetime.now() - timedelta(days=days-day, hours=readings_per_day-hour)
                
                sensor_readings.append(generate_sensor_reading(zone_id, timestamp))
                weather_data.append(generate_weather(zone_id, timestamp))
                
                # Generate actions less frequently (once per day)
                if hour == 12:  # Noon
                    actions_data.append(generate_action(zone_id, timestamp))
    
    print(f"Inserting {len(sensor_readings)} sensor readings...")
    db.sensorReadings.insert_many(sensor_readings)
    
    print(f"Inserting {len(weather_data)} weather records...")
    db.weather.insert_many(weather_data)
    
    print(f"Inserting {len(actions_data)} action records...")
    db.actions.insert_many(actions_data)
    
    print("\n✓ Database seeded successfully!")
    print(f"Zones: {len(zones)}")
    print(f"Sensor Readings: {len(sensor_readings)}")
    print(f"Weather Records: {len(weather_data)}")
    print(f"Actions: {len(actions_data)}")
    
    client.close()

if __name__ == "__main__":
    seed_database()
