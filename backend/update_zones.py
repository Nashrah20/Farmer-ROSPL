"""
Script to update zone names in MongoDB from old format to new format
Old: Clay/Sandy/Loamy/Silty/Peaty with Wheat/Cotton/Soybean
New: Coarse/Black/Laterite/Alluvial/YellowBrown with proper crops
"""

from pymongo import MongoClient
from config import Config

# Mapping from old zones to new zones based on your specification
ZONE_MAPPING = {
    # Map old soil types to new ones based on crop compatibility
    'Clay_Wheat': 'Alluvial_Wheat',
    'Clay_Cotton': 'Black_Cotton',
    'Clay_Soybean': 'Black_Soybean',
    
    'Sandy_Wheat': 'Coarse_Bajra',  # Sandy soil better for Bajra
    'Sandy_Cotton': 'Black_Cotton',
    'Sandy_Soybean': 'Black_Soybean',
    
    'Loamy_Wheat': 'Alluvial_Wheat',
    'Loamy_Cotton': 'Black_Cotton',
    'Loamy_Soybean': 'Black_Soybean',
    
    'Silty_Wheat': 'Alluvial_Wheat',
    'Silty_Cotton': 'Black_Cotton',
    'Silty_Soybean': 'Black_Soybean',
    
    'Peaty_Wheat': 'Laterite_Rice',  # Peaty soil better for Rice
    'Peaty_Cotton': 'Black_Cotton',
    'Peaty_Soybean': 'Black_Soybean',
}

def update_zones():
    """Update zone_id in all collections"""
    print("Connecting to MongoDB...")
    client = MongoClient(Config.MONGODB_URI)
    db = client[Config.MONGODB_DATABASE]
    
    collections = ['sensorReadings', 'weather', 'actions']
    
    for collection_name in collections:
        collection = db[collection_name]
        print(f"\nUpdating {collection_name}...")
        
        updated_count = 0
        for old_zone, new_zone in ZONE_MAPPING.items():
            result = collection.update_many(
                {'zone_id': old_zone},
                {'$set': {'zone_id': new_zone}}
            )
            if result.modified_count > 0:
                print(f"  {old_zone} → {new_zone}: {result.modified_count} documents")
                updated_count += result.modified_count
        
        print(f"  Total updated in {collection_name}: {updated_count}")
    
    # Verify new zones
    print("\n" + "="*60)
    print("Verification - New zones in database:")
    print("="*60)
    zones = db.sensorReadings.distinct('zone_id')
    for zone in sorted(zones):
        count = db.sensorReadings.count_documents({'zone_id': zone})
        print(f"  {zone}: {count} readings")
    
    print(f"\n✓ Update complete! Total zones: {len(zones)}")
    client.close()

if __name__ == "__main__":
    print("="*60)
    print("ZONE MIGRATION SCRIPT")
    print("="*60)
    print("\nThis will update zone names in your MongoDB database.")
    print("Old format: Clay/Sandy/Loamy/Silty/Peaty + Wheat/Cotton/Soybean")
    print("New format: Coarse/Black/Laterite/Alluvial/YellowBrown + crops")
    print("\nMappings:")
    for old, new in ZONE_MAPPING.items():
        print(f"  {old:20} → {new}")
    
    response = input("\nProceed with update? (yes/no): ")
    if response.lower() == 'yes':
        update_zones()
    else:
        print("Update cancelled.")
