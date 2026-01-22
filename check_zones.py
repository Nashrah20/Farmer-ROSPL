from pymongo import MongoClient

client = MongoClient('mongodb+srv://Cluster0:Rahul%409175@cluster0.shect.mongodb.net/FarmAi?retryWrites=true&w=majority')
db = client['FarmAi']

zones = list(db.sensorReadings.aggregate([
    {'$group': {
        '_id': '$zone_id',
        'soil': {'$first': '$soil_type'},
        'crop': {'$first': '$crop'},
        'region': {'$first': '$region'},
        'count': {'$sum': 1}
    }}
]))

print('='*70)
print('ACTUAL ZONE DATA IN YOUR DATABASE:')
print('='*70)
print(f"{'Zone ID':<10} | {'Soil Type':<15} | {'Crop':<15} | {'Region':<15} | {'Readings'}")
print('-'*70)

for z in sorted(zones, key=lambda x: x['_id'] if x['_id'] else 'N/A'):
    zone_id = z['_id'] if z['_id'] else 'N/A'
    soil = z.get('soil', 'N/A') if z.get('soil') else 'N/A'
    crop = z.get('crop', 'N/A') if z.get('crop') else 'N/A'
    region = z.get('region', 'N/A') if z.get('region') else 'N/A'
    print(f"{zone_id:<10} | {soil:<15} | {crop:<15} | {region:<15} | {z['count']:>5}")

print('='*70)
print(f"Total unique zones: {len(zones)}")
print(f"Total readings: {db.sensorReadings.count_documents({})}")

client.close()
