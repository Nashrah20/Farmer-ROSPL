from pymongo import MongoClient, DESCENDING
from datetime import datetime
from config import Config

class MongoDBClient:
    """MongoDB client wrapper for FarmAi database"""
    
    def __init__(self):
        self.client = MongoClient(Config.MONGODB_URI)
        self.db = self.client[Config.MONGODB_DATABASE]
        self.sensor_readings = self.db[Config.COLLECTION_SENSOR_READINGS]
        self.weather = self.db[Config.COLLECTION_WEATHER]
        self.actions = self.db[Config.COLLECTION_ACTIONS]
    
    def get_zones(self):
        """Get list of unique zone_ids from sensor readings"""
        try:
            zones = self.sensor_readings.distinct('zone_id')
            return sorted(zones)
        except Exception as e:
            raise Exception(f"Error fetching zones: {str(e)}")
    
    def get_latest_data(self, zone_id):
        """Get latest sensor reading and weather for a zone (not future data)"""
        try:
            from datetime import datetime
            now = datetime.now()
            
            # Get most recent sensor reading that's not in the future
            sensor = self.sensor_readings.find_one(
                {
                    'zone_id': zone_id,
                    'timestamp': {'$lte': now}
                },
                sort=[('timestamp', DESCENDING)]
            )
            
            # Get most recent weather data that's not in the future
            weather = self.weather.find_one(
                {
                    'zone_id': zone_id,
                    'timestamp': {'$lte': now}
                },
                sort=[('timestamp', DESCENDING)]
            )
            
            # Convert ObjectId to string and timestamp to ISO format
            if sensor and '_id' in sensor:
                sensor['_id'] = str(sensor['_id'])
                # Convert timestamp to ISO string without timezone info
                if 'timestamp' in sensor:
                    sensor['timestamp'] = sensor['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
            if weather and '_id' in weather:
                weather['_id'] = str(weather['_id'])
                # Convert timestamp to ISO string without timezone info
                if 'timestamp' in weather:
                    weather['timestamp'] = weather['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
            
            return {
                'sensor': sensor,
                'weather': weather
            }
        except Exception as e:
            raise Exception(f"Error fetching latest data: {str(e)}")
    
    def get_history(self, zone_id, from_date=None, to_date=None, limit=500):
        """Get historical sensor and weather data for a zone"""
        try:
            # Build query
            query = {'zone_id': zone_id}
            if from_date or to_date:
                query['timestamp'] = {}
                if from_date:
                    query['timestamp']['$gte'] = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                if to_date:
                    query['timestamp']['$lte'] = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
            
            # Fetch sensor readings
            sensor_data = list(self.sensor_readings.find(query).sort('timestamp', 1).limit(limit))
            
            # Fetch weather data
            weather_data = list(self.weather.find(query).sort('timestamp', 1).limit(limit))
            
            # Convert ObjectId to string
            for item in sensor_data:
                item['_id'] = str(item['_id'])
                if 'timestamp' in item:
                    item['timestamp'] = item['timestamp'].isoformat()
            
            for item in weather_data:
                item['_id'] = str(item['_id'])
                if 'timestamp' in item:
                    item['timestamp'] = item['timestamp'].isoformat()
            
            return {
                'sensor_readings': sensor_data,
                'weather': weather_data
            }
        except Exception as e:
            raise Exception(f"Error fetching history: {str(e)}")
    
    def get_training_data(self):
        """Fetch all data for ML training (sensor + weather + actions)"""
        try:
            # Get all sensor readings
            sensors = list(self.sensor_readings.find())
            
            # Get all weather data
            weather = list(self.weather.find())
            
            # Get all actions
            actions = list(self.actions.find())
            
            return {
                'sensors': sensors,
                'weather': weather,
                'actions': actions
            }
        except Exception as e:
            raise Exception(f"Error fetching training data: {str(e)}")
    
    def save_action(self, action_data):
        """Save an approved action to database"""
        try:
            result = self.actions.insert_one(action_data)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error saving action: {str(e)}")
    
    def close(self):
        """Close MongoDB connection"""
        self.client.close()
