from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import traceback
import sys
import os

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
from ml.reinforcement_learning import rl_system
from ml.image_analysis import image_analyzer
from services.external_services import WeatherService, MarketPriceService, GovernmentSchemesService
from services.voice_assistant import VoiceAssistant
from services.resource_tracker import ResourceTracker

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize MongoDB client
mongo_client = MongoDBClient()

# Initialize services
weather_service = WeatherService()
market_service = MarketPriceService()
schemes_service = GovernmentSchemesService()
voice_assistant = VoiceAssistant()
advanced_predictor = AdvancedPredictor(Config.ML_MODEL_PATH, Config.ML_FEATURES_PATH)
resource_tracker = ResourceTracker(mongo_client)

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

# Predict endpoint
@app.route('/api/predict', methods=['POST'])
def predict():
    """Make prediction for a zone"""
    try:
        data = request.get_json()
        
        if not data or 'zone_id' not in data:
            return jsonify({
                'success': False,
                'error': 'zone_id is required in request body'
            }), 400
        
        zone_id = data['zone_id']
        
        # Check if model exists
        if not os.path.exists(Config.ML_MODEL_PATH):
            return jsonify({
                'success': False,
                'error': 'Model not trained yet. Please call /api/train first.'
            }), 400
        
        # Fetch latest data for the zone
        latest_data = mongo_client.get_latest_data(zone_id)
        
        if not latest_data['sensor'] or not latest_data['weather']:
            return jsonify({
                'success': False,
                'error': f'No data available for zone_id: {zone_id}'
            }), 404
        
        # Make prediction
        prediction_result = make_prediction(
            Config.ML_MODEL_PATH,
            Config.ML_FEATURES_PATH,
            latest_data['sensor'],
            latest_data['weather']
        )
        
        return jsonify({
            'success': True,
            'zone_id': zone_id,
            'prediction': prediction_result
        }), 200
        
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
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

if __name__ == '__main__':
    print("\n" + "="*60)
    print("FARM AI BACKEND SERVER")
    print("="*60)
    print(f"MongoDB URI: {Config.MONGODB_URI}")
    print(f"Database: {Config.MONGODB_DATABASE}")
    print(f"Port: {Config.FLASK_PORT}")
    print("="*60 + "\n")
    
    # Disable debug mode to avoid auto-reloader issues
    app.run(
        host='0.0.0.0',
        port=Config.FLASK_PORT,
        debug=False,
        use_reloader=False
    )
