from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb+srv://Cluster0:Rahul%409175@cluster0.shect.mongodb.net/FarmAi?retryWrites=true&w=majority')
db = client['FarmAi']

latest = db.sensorReadings.find_one({}, sort=[('timestamp', -1)])
print(f'Latest timestamp in DB: {latest["timestamp"]}')
print(f'Current time: {datetime.now()}')
print(f'\nDifference: Data is {(datetime.now() - latest["timestamp"]).days} days old')

client.close()
