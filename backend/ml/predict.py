import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

def load_model_and_features(model_path, features_path):
    """Load trained model and feature configuration"""
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    
    if not os.path.exists(features_path):
        raise FileNotFoundError(f"Features file not found: {features_path}")
    
    model = joblib.load(model_path)
    
    with open(features_path, 'r') as f:
        feature_config = json.load(f)
    
    return model, feature_config

def prepare_input_features(sensor_data, weather_data, feature_columns):
    """
    Prepare input features from latest sensor and weather data
    Compatible with new reward-based model (21 features)
    """
    # Extract feature values - map new field names to model expectations
    features = {}
    
    # Basic sensor features
    features['soil_moisture'] = sensor_data.get('soil_moisture', 0)
    features['temperature'] = sensor_data.get('temperature', weather_data.get('temperature', 25))
    features['humidity'] = sensor_data.get('humidity', weather_data.get('humidity', 50))
    features['rainfall'] = sensor_data.get('rainfall', weather_data.get('rainfall', 0))
    features['nitrogen'] = sensor_data.get('nitrogen', 0)
    features['phosphorus'] = sensor_data.get('phosphorus', 0)
    features['potassium'] = sensor_data.get('potassium', 0)
    features['ph'] = sensor_data.get('ph', 7.0)
    features['ec'] = sensor_data.get('ec', 0)
    features['ndvi'] = sensor_data.get('ndvi', 0.5)
    features['leaf_health'] = sensor_data.get('leaf_health', 80)
    features['stress_level'] = sensor_data.get('stress_level', 1)
    features['wind_speed'] = sensor_data.get('wind_speed', weather_data.get('wind_speed', 0))
    
    # Advanced features (if required by model)
    if 'npk_ratio' in feature_columns:
        features['npk_ratio'] = features['nitrogen'] / (features['phosphorus'] + 1)
    if 'moisture_temp_index' in feature_columns:
        features['moisture_temp_index'] = features['soil_moisture'] * features['temperature'] / 100
    if 'health_stress_ratio' in feature_columns:
        features['health_stress_ratio'] = features['leaf_health'] / (features['stress_level'] + 1)
    
    # Time-based features
    now = datetime.now()
    if 'hour' in feature_columns:
        features['hour'] = now.hour
    if 'day_of_week' in feature_columns:
        features['day_of_week'] = now.weekday()
    if 'month' in feature_columns:
        features['month'] = now.month
    if 'is_summer' in feature_columns:
        features['is_summer'] = 1 if now.month in [4, 5, 6] else 0
    if 'is_monsoon' in feature_columns:
        features['is_monsoon'] = 1 if now.month in [7, 8, 9] else 0
    
    # Create DataFrame with correct column order
    input_df = pd.DataFrame([features])
    
    # Ensure all required columns exist
    for col in feature_columns:
        if col not in input_df.columns:
            input_df[col] = 0
    
    input_df = input_df[feature_columns]  # Ensure correct order
    
    return input_df

def generate_explanation(sensor_data, weather_data, prediction_value, feature_columns):
    """
    Generate human-readable explanation for predictions
    New model predicts irrigation amount
    """
    reasons = []
    
    # Get sensor values
    soil_moisture = sensor_data.get('soil_moisture', 50)
    temp = sensor_data.get('temperature', weather_data.get('temperature', 25))
    rainfall = sensor_data.get('rainfall', weather_data.get('rainfall', 0))
    leaf_health = sensor_data.get('leaf_health', 80)
    stress_level = sensor_data.get('stress_level', 1)
    
    # Irrigation reasoning
    irrigation_liters = prediction_value
    
    if irrigation_liters > 20:
        if soil_moisture < 40:
            reasons.append(f"High irrigation ({irrigation_liters:.1f}L) recommended: soil moisture is low ({soil_moisture:.1f}%)")
        elif temp > 30:
            reasons.append(f"High irrigation ({irrigation_liters:.1f}L) recommended: high temperature ({temp:.1f}°C) increases evaporation")
        else:
            reasons.append(f"Irrigation of {irrigation_liters:.1f}L recommended based on current conditions")
    elif irrigation_liters > 10:
        reasons.append(f"Moderate irrigation ({irrigation_liters:.1f}L) recommended to maintain optimal moisture")
    else:
        if rainfall > 10:
            reasons.append(f"Low irrigation ({irrigation_liters:.1f}L) needed: recent rainfall ({rainfall:.1f}mm) detected")
        else:
            reasons.append(f"Minimal irrigation ({irrigation_liters:.1f}L) required: soil moisture adequate")
    
    # NPK recommendations based on levels
    n_level = sensor_data.get('nitrogen', 0)
    p_level = sensor_data.get('phosphorus', 0)
    k_level = sensor_data.get('potassium', 0)
    
    fertilizer_needs = []
    if n_level < 100:
        fertilizer_needs.append(f"N supplement needed (current: {n_level:.0f} mg/kg)")
    if p_level < 30:
        fertilizer_needs.append(f"P supplement needed (current: {p_level:.0f} mg/kg)")
    if k_level < 100:
        fertilizer_needs.append(f"K supplement needed (current: {k_level:.0f} mg/kg)")
    
    if fertilizer_needs:
        reasons.append("Fertilizer: " + ", ".join(fertilizer_needs))
    else:
        reasons.append("Nutrient levels are adequate")
    
    # Stress indicators
    if stress_level > 3:
        reasons.append(f"⚠️ Plant stress detected (level {stress_level}/10) - increased care recommended")
    
    if leaf_health < 60:
        reasons.append(f"⚠️ Leaf health suboptimal ({leaf_health:.0f}/100) - monitor for pests/diseases")
    elif leaf_health > 80:
        reasons.append(f"✓ Excellent leaf health ({leaf_health:.0f}/100)")
    
    return " | ".join(reasons)

def make_prediction(model_path, features_path, sensor_data, weather_data):
    """
    Make prediction using new reward-based model (single output: irrigation_liters)
    """
    # Load model and configuration
    model, feature_config = load_model_and_features(model_path, features_path)
    
    feature_columns = feature_config['feature_columns']
    
    # Prepare input features (21 features including advanced ones)
    X = prepare_input_features(sensor_data, weather_data, feature_columns)
    
    # Make prediction - new model outputs single value (irrigation_liters)
    prediction_value = model.predict(X)[0]
    irrigation_liters = max(0, float(prediction_value))  # Ensure non-negative
    
    # Generate explanation
    explanation = generate_explanation(sensor_data, weather_data, irrigation_liters, feature_columns)
    
    # Calculate NPK recommendations based on current levels
    n_level = sensor_data.get('nitrogen', 0)
    p_level = sensor_data.get('phosphorus', 0)
    k_level = sensor_data.get('potassium', 0)
    
    # Simple rule-based fertilizer recommendations
    fertilizer_N = max(0, 150 - n_level) * 0.5  # Target 150 mg/kg
    fertilizer_P = max(0, 40 - p_level) * 0.5   # Target 40 mg/kg
    fertilizer_K = max(0, 150 - k_level) * 0.5  # Target 150 mg/kg
    
    result = {
        'predictions': {
            'irrigation_liters': round(irrigation_liters, 2),
            'fertilizer_N_g': round(fertilizer_N, 2),
            'fertilizer_P_g': round(fertilizer_P, 2),
            'fertilizer_K_g': round(fertilizer_K, 2)
        },
        'explanation': explanation,
        'model_used': feature_config.get('model_name', 'RewardBasedRandomForest'),
        'predicted_at': datetime.now().isoformat(),
        'input_summary': {
            'zone_id': sensor_data.get('zone_id', 'Unknown'),
            'soil_moisture': sensor_data.get('soil_moisture', 0),
            'temperature': sensor_data.get('temperature', weather_data.get('temperature', 0)),
            'rainfall': sensor_data.get('rainfall', weather_data.get('rainfall', 0)),
            'nitrogen': n_level,
            'phosphorus': p_level,
            'potassium': k_level,
            'leaf_health': sensor_data.get('leaf_health', 80),
            'stress_level': sensor_data.get('stress_level', 1)
        }
    }
    
    return result
