from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import traceback
import sys
import os
import requests

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from utils.mongo import MongoDBClient
# Lazy import train_models since it's only used in training endpoint
# from ml.train import train_models
from ml.predict import make_prediction
from ml.advanced_predict import AdvancedPredictor
from predict_crop import CropPredictor
from predict_irrigation_fertilizer import IrrigationFertilizerPredictor
from ml.reinforcement_learning import rl_system
from ml.image_analysis import image_analyzer
from services.external_services import WeatherService, MarketPriceService, GovernmentSchemesService
from services.voice_assistant import VoiceAssistant
from services.resource_tracker import ResourceTracker
from services.user_service import UserService

# Initialize Flask app
app = Flask(__name__)
# Enable CORS with credentials support for authentication
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3001", "http://localhost:3000", "https://farmer-hackathon-x9m8.onrender.com"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Initialize MongoDB client
mongo_client = MongoDBClient()

# Initialize services
weather_service = WeatherService()
market_service = MarketPriceService()
schemes_service = GovernmentSchemesService()
voice_assistant = VoiceAssistant()
advanced_predictor = AdvancedPredictor(Config.ML_MODEL_PATH, Config.ML_FEATURES_PATH)
resource_tracker = ResourceTracker(mongo_client)
user_service = UserService(mongo_client)

# Initialize Crop Predictor (new ML model)
try:
    crop_predictor = CropPredictor()
    print("✅ Crop Predictor initialized successfully")
except Exception as e:
    print(f"⚠️  Warning: Crop Predictor not initialized: {e}")
    crop_predictor = None

# Initialize Irrigation & Fertilizer Predictor
try:
    irrigation_fertilizer_predictor = IrrigationFertilizerPredictor()
    print("✅ Irrigation & Fertilizer Predictor initialized successfully")
except Exception as e:
    print(f"⚠️  Warning: Irrigation & Fertilizer Predictor not initialized: {e}")
    irrigation_fertilizer_predictor = None

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        zones = mongo_client.get_zones()
        return jsonify({
            'status': 'healthy',
            'mongodb': 'connected',
            'zones_count': len(zones),
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# Get zones endpoint
@app.route('/api/zones', methods=['GET'])
def get_zones():
    """Get list of unique zone_ids"""
    try:
        zones = mongo_client.get_zones()
        return jsonify({
            'success': True,
            'zones': zones,
            'count': len(zones)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Get latest data endpoint
@app.route('/api/latest', methods=['GET'])
def get_latest():
    """Get latest sensor and weather data for a zone"""
    try:
        zone_id = request.args.get('zone_id')
        
        if not zone_id:
            return jsonify({
                'success': False,
                'error': 'zone_id parameter is required'
            }), 400
        
        data = mongo_client.get_latest_data(zone_id)
        
        if not data['sensor'] and not data['weather']:
            return jsonify({
                'success': False,
                'error': f'No data found for zone_id: {zone_id}'
            }), 404
        
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'data': data
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Get history endpoint
@app.route('/api/history', methods=['GET'])
def get_history():
    """Get historical sensor and weather data for a zone"""
    try:
        zone_id = request.args.get('zone_id')
        from_date = request.args.get('from')
        to_date = request.args.get('to')
        limit = request.args.get('limit', 500, type=int)
        
        if not zone_id:
            return jsonify({
                'success': False,
                'error': 'zone_id parameter is required'
            }), 400
        
        history = mongo_client.get_history(zone_id, from_date, to_date, limit)
        
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'history': history,
            'sensor_count': len(history['sensor_readings']),
            'weather_count': len(history['weather'])
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Train model endpoint
@app.route('/api/train', methods=['POST'])
def train_model():
    """Train ML model using MongoDB data"""
    try:
        print("\n" + "="*60)
        print("Starting model training...")
        print("="*60)
        
        # Fetch training data from MongoDB
        print("Fetching data from MongoDB...")
        mongo_data = mongo_client.get_training_data()
        
        print(f"Fetched {len(mongo_data['sensors'])} sensor records")
        print(f"Fetched {len(mongo_data['weather'])} weather records")
        print(f"Fetched {len(mongo_data['actions'])} action records")
        
        if len(mongo_data['sensors']) == 0 or len(mongo_data['actions']) == 0:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for training. Need sensor readings and actions data.'
            }), 400
        
        # Lazy import train_models only when training endpoint is called
        from ml.train import train_models
        
        # Train models
        result = train_models(
            mongo_data,
            Config.ML_MODEL_PATH,
            Config.ML_FEATURES_PATH
        )
        
        return jsonify({
            'success': True,
            'message': 'Model training completed successfully',
            'best_model': result['best_model_name'],
            'metrics': {
                'mae': result['metrics']['overall_mae'],
                'rmse': result['metrics']['overall_rmse'],
                'r2': result['metrics']['overall_r2']
            },
            'model_path': Config.ML_MODEL_PATH,
            'features_path': Config.ML_FEATURES_PATH
        }), 200
        
    except Exception as e:
        print(f"Error during training: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

# Predict endpoint - NEW: Uses Crop Prediction ML Model
@app.route('/api/predict', methods=['POST'])
def predict():
    """Make crop prediction based on sensor data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        # Check if new crop predictor is available
        if crop_predictor is None:
            return jsonify({
                'success': False,
                'error': 'Crop prediction model not available. Please train the model first.'
            }), 503
        
        # Determine current season based on month
        current_month = datetime.now().month
        if 6 <= current_month <= 10:
            season = 'kharif'  # Monsoon season
        elif 11 <= current_month <= 3:
            season = 'rabi'    # Winter season
        else:
            season = 'zaid'    # Summer season
        
        # Allow season override from request
        if 'season' in data:
            season = data['season']
        
        # Extract sensor data from request
        air_temp = data.get('temperature', 25.0)
        humidity = data.get('humidity', 60.0)
        soil_moisture = data.get('soil_moisture', 45.0)
        soil_temp = data.get('soil_temp', air_temp)  # Default to air temp if not provided
        nitrogen = data.get('nitrogen', 100.0)
        phosphorus = data.get('phosphorus', 60.0)
        potassium = data.get('potassium', 80.0)
        soil_type = data.get('soil_type', 'black_soil')  # Default to black soil
        
        # Make crop prediction using ML model
        prediction_result = crop_predictor.predict_crop(
            air_temp=air_temp,
            humidity=humidity,
            soil_moisture=soil_moisture,
            soil_temp=soil_temp,
            nitrogen=nitrogen,
            phosphorus=phosphorus,
            potassium=potassium,
            season=season,
            soil_type=soil_type
        )
        
        # Format response for frontend compatibility
        response = {
            'success': True,
            'data': {
                'action': f"Plant {prediction_result['predicted_crop']}",
                'confidence': prediction_result['confidence'],
                'predicted_crop': prediction_result['predicted_crop'],
                'top_3_crops': prediction_result['top_3_crops'],
                'explanation': f"Based on current conditions (Temp: {air_temp}°C, Humidity: {humidity}%, Season: {season}), we recommend planting {prediction_result['predicted_crop']} with {prediction_result['confidence_percent']} confidence.",
                'predictions': {
                    'crop': prediction_result['predicted_crop'],
                    'alternatives': [crop['crop'] for crop in prediction_result['top_3_crops'][1:]],
                    'confidence': prediction_result['confidence_percent']
                },
                'input_summary': prediction_result['input_summary'],
                'season': season
            }
        }
        
        return jsonify(response), 200
        
    except ValueError as e:
        # Handle validation errors (e.g., invalid season)
        return jsonify({
            'success': False,
            'error': f'Validation error: {str(e)}'
        }), 400
    except Exception as e:
        print(f"Error during crop prediction: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

# Save action endpoint (optional)
@app.route('/api/actions', methods=['POST'])
def save_action():
    """Save an approved action"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        # Add timestamp if not present
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now()
        
        # Save to MongoDB
        action_id = mongo_client.save_action(data)
        
        return jsonify({
            'success': True,
            'action_id': action_id,
            'message': 'Action saved successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Irrigation & Fertilizer Prediction Endpoint
@app.route('/api/predict-irrigation-fertilizer', methods=['POST'])
def predict_irrigation_fertilizer():
    """Predict irrigation and fertilizer requirements based on sensor data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        # Check if predictor is available
        if irrigation_fertilizer_predictor is None:
            return jsonify({
                'success': False,
                'error': 'Irrigation & Fertilizer prediction model not available. Please train the model first.'
            }), 503
        
        # Extract required parameters from request
        soil_moisture = data.get('soil_moisture')
        soil_temp = data.get('soil_temp')
        air_temp = data.get('air_temp')
        humidity = data.get('humidity')
        
        # Validate required parameters
        if soil_moisture is None or soil_temp is None or air_temp is None or humidity is None:
            return jsonify({
                'success': False,
                'error': 'Required parameters: soil_moisture, soil_temp, air_temp, humidity'
            }), 400
        
        # Extract optional parameters with defaults
        wind = data.get('wind', 0)
        rainfall = data.get('rainfall', 0)
        ph = data.get('ph', 7.0)
        ec = data.get('ec', 0.4)
        nitrogen = data.get('nitrogen', 50)
        phosphorus = data.get('phosphorus', 20)
        potassium = data.get('potassium', 150)
        ndvi = data.get('ndvi', 0.5)
        leaf_health = data.get('leaf_health', 85)
        stress_level = data.get('stress_level', 5)
        soil_type = data.get('soil_type', 'coarse')
        crop = data.get('crop', 'wheat')
        crop_stage = data.get('crop_stage', 'Growing')
        region = data.get('region', 'NorthMaha')
        
        # Make prediction
        result = irrigation_fertilizer_predictor.predict(
            soil_moisture=soil_moisture,
            soil_temp=soil_temp,
            air_temp=air_temp,
            humidity=humidity,
            wind=wind,
            rainfall=rainfall,
            ph=ph,
            ec=ec,
            nitrogen=nitrogen,
            phosphorus=phosphorus,
            potassium=potassium,
            ndvi=ndvi,
            leaf_health=leaf_health,
            stress_level=stress_level,
            soil_type=soil_type,
            crop=crop,
            crop_stage=crop_stage,
            region=region
        )
        
        # Check if prediction has error
        if 'error' in result:
            return jsonify({
                'success': False,
                'error': result['error'],
                'message': result.get('message', 'Prediction failed')
            }), 500
        
        # Return successful prediction
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        print(f"Error during irrigation/fertilizer prediction: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

# Advanced Prediction Endpoint
@app.route('/api/predict/advanced', methods=['POST'])
def predict_advanced():
    """Get comprehensive predictions including disease, pest, yield, and weather recommendations"""
    try:
        data = request.get_json()
        
        if not data or 'zone_id' not in data:
            return jsonify({
                'success': False,
                'error': 'zone_id is required in request body'
            }), 400
        
        zone_id = data['zone_id']
        crop_type = data.get('crop_type', 'general')
        
        print(f"Processing advanced prediction for zone: {zone_id}, crop: {crop_type}")
        
        # Fetch latest data for the zone
        latest_data = mongo_client.get_latest_data(zone_id)
        
        if not latest_data['sensor'] or not latest_data['weather']:
            return jsonify({
                'success': False,
                'error': f'No data available for zone_id: {zone_id}'
            }), 404
        
        print(f"Latest data fetched - sensor: {bool(latest_data['sensor'])}, weather: {bool(latest_data['weather'])}")
        
        # Get weather forecast (mock for now, can be real with API key)
        weather_forecast = weather_service.get_forecast(28.6139, 77.2090, 7)  # Delhi coords as example
        
        # Load advanced predictor
        advanced_predictor.load_models()
        print(f"Models loaded - model: {bool(advanced_predictor.model)}, features: {bool(advanced_predictor.feature_config)}")
        
        # Get comprehensive prediction
        comprehensive_result = advanced_predictor.get_comprehensive_prediction(
            latest_data['sensor'],
            latest_data['weather'],
            weather_forecast,
            crop_type
        )
        
        print(f"Prediction generated successfully. Keys: {list(comprehensive_result.keys())}")
        
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'crop_type': crop_type,
            'predictions': comprehensive_result
        }), 200
        
    except Exception as e:
        print(f"Error during advanced prediction: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Weather Endpoint
@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Get current weather and forecast"""
    try:
        lat = request.args.get('lat', 28.6139, type=float)  # Default to Delhi
        lon = request.args.get('lon', 77.2090, type=float)
        days = request.args.get('days', 7, type=int)
        
        current_weather = weather_service.get_current_weather(lat, lon)
        forecast = weather_service.get_forecast(lat, lon, days)
        
        return jsonify({
            'success': True,
            'current': current_weather,
            'forecast': forecast
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Market Prices Endpoint
@app.route('/api/market/prices', methods=['GET'])
def get_market_prices():
    """Get current market prices"""
    try:
        crop = request.args.get('crop')
        
        if crop:
            price_data = market_service.get_crop_price(crop)
            return jsonify({
                'success': True,
                'data': price_data
            }), 200
        else:
            all_prices = market_service.get_all_prices()
            return jsonify({
                'success': True,
                'data': all_prices
            }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Revenue Estimation Endpoint
@app.route('/api/market/revenue', methods=['POST'])
def estimate_revenue():
    """Calculate estimated revenue from yield prediction"""
    try:
        data = request.get_json()
        
        crop_type = data.get('crop_type', 'rice')
        yield_kg = data.get('yield_kg', 0)
        area = data.get('area_hectares', 1)
        
        revenue = market_service.calculate_revenue_estimate(crop_type, yield_kg, area)
        
        return jsonify({
            'success': True,
            'data': revenue
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Government Schemes Endpoints
@app.route('/api/schemes', methods=['GET'])
def get_schemes():
    """Get government schemes and subsidies"""
    try:
        category = request.args.get('category')
        search = request.args.get('search')
        
        if search:
            schemes = schemes_service.search_schemes(search)
        elif category:
            schemes = schemes_service.get_all_schemes(category)
        else:
            schemes = schemes_service.get_all_schemes()
        
        return jsonify({
            'success': True,
            'schemes': schemes,
            'count': len(schemes)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/schemes/recommended', methods=['POST'])
def get_recommended_schemes():
    """Get personalized scheme recommendations"""
    try:
        farmer_profile = request.get_json()
        
        if not farmer_profile:
            return jsonify({
                'success': False,
                'error': 'Farmer profile required'
            }), 400
        
        recommended = schemes_service.get_recommended_schemes(farmer_profile)
        
        return jsonify({
            'success': True,
            'recommended_schemes': recommended,
            'count': len(recommended)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Voice Assistant Endpoints
@app.route('/api/voice/command', methods=['POST'])
def process_voice_command():
    """Process voice command from farmer"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Voice text is required'
            }), 400
        
        text = data['text']
        language = data.get('language', 'en')
        zone_id = data.get('zone_id')
        
        response = voice_assistant.process_voice_command(text, language, zone_id)
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/voice/speak', methods=['POST'])
def text_to_speech():
    """Convert prediction to voice-friendly format"""
    try:
        data = request.get_json()
        
        if not data or 'prediction' not in data:
            return jsonify({
                'success': False,
                'error': 'Prediction data required'
            }), 400
        
        language = data.get('language', 'en')
        prediction = data['prediction']
        
        voice_text = voice_assistant.format_prediction_for_voice(prediction, language)
        
        return jsonify({
            'success': True,
            'voice_text': voice_text,
            'language': language
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Disease Detection Endpoint
@app.route('/api/disease/detect', methods=['POST'])
def detect_disease():
    """Detect disease risk from conditions"""
    try:
        data = request.get_json()
        zone_id = data.get('zone_id')
        
        if not zone_id:
            return jsonify({
                'success': False,
                'error': 'zone_id required'
            }), 400
        
        # Fetch latest data
        latest_data = mongo_client.get_latest_data(zone_id)
        
        if not latest_data['sensor'] or not latest_data['weather']:
            return jsonify({
                'success': False,
                'error': f'No data available for zone_id: {zone_id}'
            }), 404
        
        # Load predictor
        advanced_predictor.load_models()
        
        # Get disease prediction
        disease_result = advanced_predictor.predict_disease_risk(
            latest_data['sensor'],
            latest_data['weather']
        )
        
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'disease_analysis': disease_result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Pest Detection Endpoint
@app.route('/api/pest/detect', methods=['POST'])
def detect_pest():
    """Detect pest risk from conditions"""
    try:
        data = request.get_json()
        zone_id = data.get('zone_id')
        
        if not zone_id:
            return jsonify({
                'success': False,
                'error': 'zone_id required'
            }), 400
        
        # Fetch latest data
        latest_data = mongo_client.get_latest_data(zone_id)
        
        if not latest_data['sensor'] or not latest_data['weather']:
            return jsonify({
                'success': False,
                'error': f'No data available for zone_id: {zone_id}'
            }), 404
        
        # Load predictor
        advanced_predictor.load_models()
        
        # Get pest prediction
        pest_result = advanced_predictor.predict_pest_risk(
            latest_data['sensor'],
            latest_data['weather']
        )
        
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'pest_analysis': pest_result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Yield Prediction Endpoint
@app.route('/api/yield/predict', methods=['POST'])
def predict_yield():
    """Predict crop yield"""
    try:
        data = request.get_json()
        zone_id = data.get('zone_id')
        crop_type = data.get('crop_type', 'general')
        
        if not zone_id:
            return jsonify({
                'success': False,
                'error': 'zone_id required'
            }), 400
        
        # Fetch latest data
        latest_data = mongo_client.get_latest_data(zone_id)
        
        if not latest_data['sensor'] or not latest_data['weather']:
            return jsonify({
                'success': False,
                'error': f'No data available for zone_id: {zone_id}'
            }), 404
        
        # Load predictor
        advanced_predictor.load_models()
        
        # Get yield prediction
        yield_result = advanced_predictor.predict_yield(
            latest_data['sensor'],
            latest_data['weather'],
            crop_type
        )
        
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'yield_forecast': yield_result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500

# ============================================
# NEW ENDPOINTS FOR MISSING REQUIREMENTS
# ============================================

# Image Analysis Endpoint (Requirement #11)
@app.route('/api/image/analyze', methods=['POST'])
def analyze_crop_image():
    """Analyze crop/leaf image for disease detection"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Image data required (base64 encoded)'
            }), 400
        
        image_base64 = data['image']
        zone_id = data.get('zone_id')
        
        # Analyze image
        result = image_analyzer.analyze_image_from_base64(image_base64)
        
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'analysis': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Reinforcement Learning - Reward Feedback (Requirement #4)
@app.route('/api/feedback/reward', methods=['POST'])
def submit_reward_feedback():
    """Submit feedback on recommendation outcome for RL"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Feedback data required'
            }), 400
        
        zone_id = data.get('zone_id')
        predicted_action = data.get('predicted_action', {})
        actual_outcome = data.get('actual_outcome', {})
        sensor_before = data.get('sensor_before', {})
        sensor_after = data.get('sensor_after', {})
        
        # Calculate reward
        reward_result = rl_system.calculate_reward(
            predicted_action,
            actual_outcome,
            sensor_before,
            sensor_after
        )
        
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'reward': reward_result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Reinforcement Learning - Manual Feedback (Requirement #4)
@app.route('/api/feedback/manual', methods=['POST'])
def submit_manual_feedback():
    """Farmer provides manual feedback on recommendation"""
    try:
        data = request.get_json()
        
        action_id = data.get('action_id')
        feedback_type = data.get('feedback_type')  # excellent, good, neutral, poor
        zone_id = data.get('zone_id')
        comment = data.get('comment', '')
        
        if not all([action_id, feedback_type, zone_id]):
            return jsonify({
                'success': False,
                'error': 'action_id, feedback_type, and zone_id required'
            }), 400
        
        feedback_result = rl_system.provide_feedback(
            action_id,
            feedback_type,
            zone_id,
            comment
        )
        
        return jsonify(feedback_result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Reinforcement Learning - Get Statistics (Requirement #4)
@app.route('/api/feedback/stats', methods=['GET'])
def get_rl_statistics():
    """Get reinforcement learning statistics"""
    try:
        stats = rl_system.get_reward_statistics()
        
        return jsonify({
            'success': True,
            'statistics': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Resource Tracking - Log Usage (Requirement #10)
@app.route('/api/resources/track', methods=['POST'])
def track_resource_usage():
    """Track water or fertilizer usage"""
    try:
        data = request.get_json()
        
        zone_id = data.get('zone_id')
        resource_type = data.get('type')  # 'irrigation' or 'fertilizer'
        
        if not zone_id or not resource_type:
            return jsonify({
                'success': False,
                'error': 'zone_id and type required'
            }), 400
        
        if resource_type == 'irrigation':
            amount = data.get('amount_liters', 0)
            result = resource_tracker.track_irrigation(zone_id, amount)
        elif resource_type == 'fertilizer':
            N = data.get('N_g', 0)
            P = data.get('P_g', 0)
            K = data.get('K_g', 0)
            result = resource_tracker.track_fertilizer(zone_id, N, P, K)
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid resource type'
            }), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Resource Tracking - Get Summary (Requirement #10)
@app.route('/api/resources/summary', methods=['GET'])
def get_resource_summary():
    """Get resource usage summary"""
    try:
        zone_id = request.args.get('zone_id')
        days = request.args.get('days', 30, type=int)
        
        if not zone_id:
            return jsonify({
                'success': False,
                'error': 'zone_id required'
            }), 400
        
        summary = resource_tracker.get_usage_summary(zone_id, days)
        
        return jsonify({
            'success': True,
            'summary': summary
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Resource Tracking - Identify Wastage (Requirement #10)
@app.route('/api/resources/wastage', methods=['GET'])
def identify_resource_wastage():
    """Identify potential resource wastage"""
    try:
        zone_id = request.args.get('zone_id')
        days = request.args.get('days', 30, type=int)
        
        if not zone_id:
            return jsonify({
                'success': False,
                'error': 'zone_id required'
            }), 400
        
        wastage = resource_tracker.identify_wastage(zone_id, days)
        
        return jsonify({
            'success': True,
            'wastage_analysis': wastage
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Resource Tracking - Soil Balance (Requirement #10)
@app.route('/api/resources/soil-balance', methods=['GET'])
def get_soil_balance():
    """Get soil nutrient balance trend"""
    try:
        zone_id = request.args.get('zone_id')
        days = request.args.get('days', 30, type=int)
        
        if not zone_id:
            return jsonify({
                'success': False,
                'error': 'zone_id required'
            }), 400
        
        balance = resource_tracker.get_soil_balance_trend(zone_id, days)
        
        return jsonify({
            'success': True,
            'soil_balance': balance
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Resource Tracking - Stress History (Requirement #10)
@app.route('/api/resources/stress-history', methods=['GET'])
def get_stress_history():
    """Get crop stress history"""
    try:
        zone_id = request.args.get('zone_id')
        days = request.args.get('days', 30, type=int)
        
        if not zone_id:
            return jsonify({
                'success': False,
                'error': 'zone_id required'
            }), 400
        
        stress_history = resource_tracker.get_crop_stress_history(zone_id, days)
        
        return jsonify({
            'success': True,
            'stress_history': stress_history
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# USER AUTHENTICATION ENDPOINTS
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        username = data.get('username')
        password = data.get('password')
        soil_type = data.get('soil_type')
        
        # Validate required fields
        if not username or not password or not soil_type:
            return jsonify({
                'success': False,
                'error': 'Username, password, and soil_type are required'
            }), 400
        
        # Validate soil type
        valid_soil_types = ['black_soil', 'red_soil', 'laterite_soil', 'alluvial_soil', 'saline_alkaline_soil']
        if soil_type not in valid_soil_types:
            return jsonify({
                'success': False,
                'error': f'Invalid soil_type. Must be one of: {", ".join(valid_soil_types)}'
            }), 400
        
        # Create user
        user, error = user_service.create_user(username, password, soil_type)
        
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': {
                'username': user['username'],
                'soil_type': user['soil_type']
            }
        }), 201
        
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'error': 'Username and password are required'
            }), 400
        
        # Authenticate user
        user, error = user_service.authenticate_user(username, password)
        
        if error:
            return jsonify({
                'success': False,
                'error': error
            }), 401
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'username': user['username'],
                'soil_type': user['soil_type']
            }
        }), 200
        
    except Exception as e:
        print(f"Error during login: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/auth/user/<username>', methods=['GET'])
def get_user_profile(username):
    """Get user profile"""
    try:
        user = user_service.get_user(username)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user
        }), 200
        
    except Exception as e:
        print(f"Error fetching user profile: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/auth/update-soil-type', methods=['PUT'])
def update_user_soil_type():
    """Update user's soil type preference"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        username = data.get('username')
        soil_type = data.get('soil_type')
        
        if not username or not soil_type:
            return jsonify({
                'success': False,
                'error': 'Username and soil_type are required'
            }), 400
        
        # Update soil type
        success = user_service.update_soil_type(username, soil_type)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to update soil type'
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Soil type updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error updating soil type: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# EXTERNAL API PROXY ENDPOINTS
# ============================================================================

@app.route('/api/external/weather', methods=['GET'])
def proxy_weather_data():
    """Proxy external weather API - WeatherAPI.com"""
    try:
        location = request.args.get('location', 'mumbai')
        api_key = os.getenv('WEATHER_API_KEY', '079a0828828c4c57af2133300262401')
        
        response = requests.get(
            f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={location}&aqi=no",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return jsonify({
                'success': True,
                'data': {
                    'temperature': data['current']['temp_c'],
                    'humidity': data['current']['humidity'],
                    'condition': data['current']['condition']['text'],
                    'wind_kph': data['current']['wind_kph'],
                    'timestamp': datetime.utcnow().isoformat()
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': f'Weather API returned {response.status_code}'
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'Weather API timeout'
        }), 504
    except Exception as e:
        print(f"❌ Weather API Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/external/soil', methods=['GET'])
def proxy_soil_data():
    """Proxy external soil sensor API - AgroMonitoring"""
    try:
        lat = float(request.args.get('lat', 18.975))
        lon = float(request.args.get('lon', 72.826))
        api_key = os.getenv('AGRO_API_KEY', '97f32bc1c704c19fbb76c734b0c127b6')
        
        response = requests.get(
            f"http://api.agromonitoring.com/agro/1.0/soil?lat={lat}&lon={lon}&appid={api_key}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return jsonify({
                'success': True,
                'data': {
                    'moisture': data.get('moisture', 0),
                    'temperature': data.get('t0', 0),
                    'timestamp': datetime.utcnow().isoformat()
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': f'Soil API returned {response.status_code}'
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'Soil API timeout'
        }), 504
    except Exception as e:
        print(f"❌ Soil API Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/external/npk', methods=['GET'])
def proxy_npk_data():
    """Proxy external NPK sensor API"""
    try:
        npk_api_url = os.getenv('NPK_API_URL', 'https://npk-agriculture-api.onrender.com')
        
        response = requests.get(
            f"{npk_api_url}/api/npk/latest",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            data = result.get('data', {})
            return jsonify({
                'success': True,
                'data': {
                    'nitrogen': data.get('nitrogen', 0),
                    'phosphorus': data.get('phosphorus', 0),
                    'potassium': data.get('potassium', 0),
                    'timestamp': datetime.utcnow().isoformat()
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': f'NPK API returned {response.status_code}'
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'NPK API timeout'
        }), 504
    except Exception as e:
        print(f"❌ NPK API Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/external/all', methods=['GET'])
def proxy_all_sensor_data():
    """Get all external sensor data in one call"""
    try:
        location = request.args.get('location', 'mumbai')
        lat = float(request.args.get('lat', 18.975))
        lon = float(request.args.get('lon', 72.826))
        
        results = {
            'success': True,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Fetch weather data
        try:
            weather_api_key = os.getenv('WEATHER_API_KEY', '079a0828828c4c57af2133300262401')
            weather_response = requests.get(
                f"http://api.weatherapi.com/v1/current.json?key={weather_api_key}&q={location}&aqi=no",
                timeout=5
            )
            if weather_response.status_code == 200:
                weather_data = weather_response.json()
                results['weather'] = {
                    'temperature': weather_data['current']['temp_c'],
                    'humidity': weather_data['current']['humidity'],
                    'condition': weather_data['current']['condition']['text'],
                    'wind_kph': weather_data['current']['wind_kph']
                }
        except Exception as e:
            results['weather'] = {'error': str(e)}
        
        # Fetch soil data
        try:
            agro_api_key = os.getenv('AGRO_API_KEY', '97f32bc1c704c19fbb76c734b0c127b6')
            soil_response = requests.get(
                f"http://api.agromonitoring.com/agro/1.0/soil?lat={lat}&lon={lon}&appid={agro_api_key}",
                timeout=5
            )
            if soil_response.status_code == 200:
                soil_data = soil_response.json()
                results['soil'] = {
                    'moisture': soil_data.get('moisture', 0),
                    'temperature': soil_data.get('t0', 0)
                }
        except Exception as e:
            results['soil'] = {'error': str(e)}
        
        # Fetch NPK data
        try:
            npk_api_url = os.getenv('NPK_API_URL', 'https://npk-agriculture-api.onrender.com')
            npk_response = requests.get(f"{npk_api_url}/api/npk/latest", timeout=5)
            if npk_response.status_code == 200:
                npk_result = npk_response.json()
                npk_data = npk_result.get('data', {})
                results['npk'] = {
                    'nitrogen': npk_data.get('nitrogen', 0),
                    'phosphorus': npk_data.get('phosphorus', 0),
                    'potassium': npk_data.get('potassium', 0)
                }
        except Exception as e:
            results['npk'] = {'error': str(e)}
        
        return jsonify(results), 200
        
    except Exception as e:
        print(f"❌ Error fetching all sensor data: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    print("\n" + "="*60)
    print("FARM AI BACKEND SERVER")
    print("="*60)
    print(f"MongoDB URI: {Config.MONGODB_URI}")
    print(f"Database: {Config.MONGODB_DATABASE}")
    print(f"Port: {Config.FLASK_PORT}")
    print("="*60 + "\n")
    
    # Get port from environment variable (for deployment) or use config
    port = int(os.environ.get('PORT', Config.FLASK_PORT))
    
    # Disable debug mode to avoid auto-reloader issues
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        use_reloader=False
    )
