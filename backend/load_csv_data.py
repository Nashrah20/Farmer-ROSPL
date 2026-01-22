"""
Load actual CSV data from Data folder into MongoDB
"""

from pymongo import MongoClient
import pandas as pd
from datetime import datetime
from config import Config

def load_csv_data():
    """Load CSV files and insert into MongoDB"""
    print("="*70)
    print("LOADING CSV DATA INTO MONGODB")
    print("="*70)
    
    client = MongoClient(Config.MONGODB_URI)
    db = client[Config.MONGODB_DATABASE]
    
    # Clear existing data
    print("\nClearing existing data...")
    db.sensorReadings.delete_many({})
    db.weather.delete_many({})
    db.actions.delete_many({})
    print("✓ Collections cleared")
    
    # Load sensor readings
    print("\n[1/3] Loading sensor readings...")
    sensor_file = 'Data/maharashtra_rabi_sensor_readings_15crops_20251101_20260301_hourly(1).csv'
    df_sensor = pd.read_csv(sensor_file)
    
    # Convert timestamp column to datetime
    df_sensor['timestamp'] = pd.to_datetime(df_sensor['timestamp'])
    
    # Rename columns to match app expectations
    column_mapping = {
        'soil_moisture_pct': 'soil_moisture',
        'soil_temp_c': 'soil_temperature',
        'air_temp_c': 'temperature',
        'humidity_pct': 'humidity',
        'wind_kmph': 'wind_speed',
        'rainfall_mm': 'rainfall',
        'EC_ds_m': 'ec',
        'N_mgkg': 'nitrogen',
        'P_mgkg': 'phosphorus',
        'K_mgkg': 'potassium',
        'NDVI': 'ndvi',
        'leaf_health_score': 'leaf_health',
        'stress_level': 'stress_level'
    }
    df_sensor = df_sensor.rename(columns=column_mapping)
    
    # Convert to list of dictionaries
    sensor_records = df_sensor.to_dict('records')
    
    print(f"  Total records: {len(sensor_records):,}")
    print(f"  Date range: {df_sensor['timestamp'].min()} to {df_sensor['timestamp'].max()}")
    print(f"  Zones: {df_sensor['zone_id'].nunique()}")
    
    # Insert in batches
    batch_size = 5000
    for i in range(0, len(sensor_records), batch_size):
        batch = sensor_records[i:i+batch_size]
        db.sensorReadings.insert_many(batch)
        print(f"  Inserted {min(i+batch_size, len(sensor_records)):,}/{len(sensor_records):,}")
    
    # Load weather data
    print("\n[2/3] Loading weather data...")
    weather_file = 'Data/maharashtra_rabi_weather_15crops_20251101_20260301_hourly.csv'
    df_weather = pd.read_csv(weather_file)
    
    df_weather['timestamp'] = pd.to_datetime(df_weather['timestamp'])
    weather_records = df_weather.to_dict('records')
    
    print(f"  Total records: {len(weather_records):,}")
    
    for i in range(0, len(weather_records), batch_size):
        batch = weather_records[i:i+batch_size]
        db.weather.insert_many(batch)
        print(f"  Inserted {min(i+batch_size, len(weather_records)):,}/{len(weather_records):,}")
    
    # Load actions
    print("\n[3/3] Loading actions...")
    actions_file = 'Data/maharashtra_rabi_actions_15crops_20251101_20260301_hourly.csv'
    df_actions = pd.read_csv(actions_file)
    
    df_actions['timestamp'] = pd.to_datetime(df_actions['timestamp'])
    action_records = df_actions.to_dict('records')
    
    print(f"  Total records: {len(action_records):,}")
    
    for i in range(0, len(action_records), batch_size):
        batch = action_records[i:i+batch_size]
        db.actions.insert_many(batch)
        print(f"  Inserted {min(i+batch_size, len(action_records)):,}/{len(action_records):,}")
    
    # Verify zones
    print("\n" + "="*70)
    print("VERIFICATION:")
    print("="*70)
    
    zones = db.sensorReadings.distinct('zone_id')
    print(f"\nUnique zones: {len(zones)}")
    for zone in sorted(zones):
        count = db.sensorReadings.count_documents({'zone_id': zone})
        latest = db.sensorReadings.find_one({'zone_id': zone}, sort=[('timestamp', -1)])
        print(f"  {zone:10} - {count:,} readings | Latest: {latest['timestamp']}")
    
    print(f"\n✓ Data loaded successfully!")
    print(f"  Total sensor readings: {db.sensorReadings.count_documents({}):,}")
    print(f"  Total weather records: {db.weather.count_documents({}):,}")
    print(f"  Total actions: {db.actions.count_documents({}):,}")
    
    client.close()

if __name__ == "__main__":
    try:
        load_csv_data()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
