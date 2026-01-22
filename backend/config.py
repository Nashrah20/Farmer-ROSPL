import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration"""
    
    # MongoDB settings
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'FarmAi')
    
    # Flask settings
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # ML model paths
    ML_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml', 'model.pkl')
    ML_FEATURES_PATH = os.path.join(os.path.dirname(__file__), 'ml', 'features.json')
    
    # Data collection names
    COLLECTION_SENSOR_READINGS = 'sensorReadings'
    COLLECTION_WEATHER = 'weather'
    COLLECTION_ACTIONS = 'actions'
