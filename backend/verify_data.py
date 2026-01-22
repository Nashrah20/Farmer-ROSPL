"""Verify the loaded CSV data"""
from pymongo import MongoClient
from config import Config
from datetime import datetime

client = MongoClient(Config.MONGODB_URI)
db = client[Config.MONGODB_DATABASE]

print("\n" + "="*70)
print("DATABASE VERIFICATION")
print("="*70)

# Check all collections
print(f"\nTotal sensor readings: {db.sensorReadings.count_documents({}):,}")
print(f"Total weather records: {db.weather.count_documents({}):,}")
print(f"Total actions: {db.actions.count_documents({}):,}")

# Get a sample reading
sample = db.sensorReadings.find_one({'zone_id': 'CS1'}, sort=[('timestamp', -1)])
print(f"\nSample latest reading for CS1:")
print(f"  Zone: {sample['zone_id']}")
print(f"  Soil Type: {sample.get('soil_type', 'N/A')}")
print(f"  Crop: {sample.get('crop', 'N/A')}")
print(f"  Timestamp: {sample['timestamp']}")
print(f"  Soil Moisture: {sample.get('soil_moisture', 'N/A')}")
print(f"  Temperature: {sample.get('temperature', 'N/A')}°C")

# Check all zones
zones = db.sensorReadings.distinct('zone_id')
print(f"\nAll zones in database: {sorted(zones)}")

client.close()
print("\n✓ Verification complete!")
