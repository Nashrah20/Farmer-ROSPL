from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb+srv://Cluster0:Rahul%409175@cluster0.shect.mongodb.net/FarmAi?retryWrites=true&w=majority')
db = client['FarmAi']

result = list(db.sensorReadings.find({'zone_id': 'AS1'}).sort('timestamp', -1).limit(3))
print('\nLast 3 timestamps for AS1:')
for r in result:
    print(f"{r['timestamp']}")

print(f"\nCurrent time: {datetime.now()}")
client.close()
