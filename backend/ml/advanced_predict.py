import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import requests

class AdvancedPredictor:
    """Enhanced ML predictor with disease detection, pest prediction, and yield forecasting"""
    
    def __init__(self, model_path, features_path):
        self.model_path = model_path
        self.features_path = features_path
        self.model = None
        self.feature_config = None
        
    def load_models(self):
        """Load trained models and feature configuration"""
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        
        if os.path.exists(self.features_path):
            with open(self.features_path, 'r') as f:
                self.feature_config = json.load(f)
    
    def predict_disease_risk(self, sensor_data, weather_data):
        """
        Predict crop disease risk based on conditions
        Rules-based system (can be replaced with trained model)
        """
        risks = []
        risk_level = "LOW"
        
        humidity = weather_data.get('humidity', 50)
        temp = weather_data.get('temperature', 25)
        rainfall = weather_data.get('rainfall', 0)
        leaf_health = sensor_data.get('leaf_health', 80)
        
        # Fungal disease risk (high humidity + moderate temperature)
        if humidity > 80 and 20 < temp < 30:
            risks.append({
                'disease': 'Fungal Infection (Blight/Mildew)',
                'risk': 'HIGH',
                'reason': f'High humidity ({humidity}%) and favorable temperature ({temp}°C)',
                'action': 'Apply fungicide, ensure proper ventilation, avoid overhead irrigation'
            })
            risk_level = "HIGH"
        elif humidity > 70 and leaf_health < 70:
            risks.append({
                'disease': 'Leaf Spot/Rust',
                'risk': 'MEDIUM',
                'reason': f'Elevated humidity ({humidity}%) with declining leaf health',
                'action': 'Monitor closely, remove infected leaves, apply preventive spray'
            })
            if risk_level == "LOW":
                risk_level = "MEDIUM"
        
        # Bacterial disease risk (high temperature + recent rainfall)
        if temp > 30 and rainfall > 20:
            risks.append({
                'disease': 'Bacterial Blight',
                'risk': 'MEDIUM',
                'reason': f'High temperature ({temp}°C) following heavy rainfall',
                'action': 'Apply copper-based bactericide, improve drainage'
            })
            if risk_level == "LOW":
                risk_level = "MEDIUM"
        
        # Viral disease (stress + pest vectors)
        stress_level = sensor_data.get('stress_level', 0)
        if stress_level > 7:
            risks.append({
                'disease': 'Viral Infection (via insect vectors)',
                'risk': 'MEDIUM',
                'reason': f'High plant stress level ({stress_level}/10)',
                'action': 'Control insect populations, remove infected plants, use resistant varieties'
            })
            if risk_level == "LOW":
                risk_level = "MEDIUM"
        
        # Root rot risk (over-irrigation + poor drainage)
        soil_moisture = sensor_data.get('soil_moisture', 50)
        if soil_moisture > 85 and rainfall > 10:
            risks.append({
                'disease': 'Root Rot',
                'risk': 'HIGH',
                'reason': f'Waterlogged soil ({soil_moisture}% moisture)',
                'action': 'Reduce irrigation, improve drainage, apply root health products'
            })
            risk_level = "HIGH"
        
        if not risks:
            risks.append({
                'disease': 'None detected',
                'risk': 'LOW',
                'reason': 'All parameters within healthy range',
                'action': 'Continue regular monitoring and preventive care'
            })
        
        return {
            'overall_risk': risk_level,
            'diseases': risks,
            'last_check': datetime.now().isoformat()
        }
    
    def predict_pest_risk(self, sensor_data, weather_data, history_data=None):
        """Predict pest infestation risk"""
        pests = []
        risk_level = "LOW"
        
        temp = weather_data.get('temperature', 25)
        humidity = weather_data.get('humidity', 50)
        stress_level = sensor_data.get('stress_level', 0)
        
        # Aphids (warm weather, stressed plants)
        if 20 < temp < 30 and stress_level > 5:
            pests.append({
                'pest': 'Aphids',
                'risk': 'MEDIUM',
                'reason': f'Optimal temperature ({temp}°C) with plant stress',
                'action': 'Spray neem oil or insecticidal soap, introduce ladybugs'
            })
            if risk_level == "LOW":
                risk_level = "MEDIUM"
        
        # Whiteflies (hot, dry conditions)
        if temp > 28 and humidity < 60:
            pests.append({
                'pest': 'Whiteflies',
                'risk': 'HIGH',
                'reason': f'Hot ({temp}°C) and dry conditions ({humidity}% humidity)',
                'action': 'Use yellow sticky traps, spray horticultural oil'
            })
            risk_level = "HIGH"
        
        # Caterpillars/Borers (moderate temperature)
        if 22 < temp < 28:
            pests.append({
                'pest': 'Caterpillars/Borers',
                'risk': 'MEDIUM',
                'reason': f'Favorable temperature for larval development',
                'action': 'Hand-pick larvae, use Bt spray, install pheromone traps'
            })
            if risk_level == "LOW":
                risk_level = "MEDIUM"
        
        # Spider mites (hot, dry)
        if temp > 32 and humidity < 50:
            pests.append({
                'pest': 'Spider Mites',
                'risk': 'HIGH',
                'reason': f'Very hot ({temp}°C) and dry ({humidity}% humidity)',
                'action': 'Increase humidity, spray water on leaf undersides, use miticides'
            })
            risk_level = "HIGH"
        
        if not pests:
            pests.append({
                'pest': 'None detected',
                'risk': 'LOW',
                'reason': 'Conditions not favorable for common pests',
                'action': 'Maintain regular scouting and preventive measures'
            })
        
        return {
            'overall_risk': risk_level,
            'pests': pests,
            'last_check': datetime.now().isoformat()
        }
    
    def predict_yield(self, sensor_data, weather_data, crop_type='general'):
        """
        Estimate potential yield based on current conditions
        This is a simplified model - should be trained with historical yield data
        """
        # Baseline yield per unit area (kg/hectare) - varies by crop
        baseline_yields = {
            'rice': 4000,
            'wheat': 3000,
            'corn': 5000,
            'tomato': 40000,
            'potato': 25000,
            'general': 3500
        }
        
        base_yield = baseline_yields.get(crop_type.lower(), baseline_yields['general'])
        
        # Calculate health score (0-1)
        soil_moisture = sensor_data.get('soil_moisture_pct', 50)
        moisture_score = 1.0 if 40 <= soil_moisture <= 70 else max(0.5, 1.0 - abs(soil_moisture - 55) / 55)
        
        leaf_health = sensor_data.get('leaf_health_score', 80)
        health_score = leaf_health / 100
        
        stress_level = sensor_data.get('stress_level', 0)
        stress_score = max(0.5, 1.0 - stress_level / 10)
        
        # Nutrient balance score
        N = sensor_data.get('nitrogen', 200)
        P = sensor_data.get('phosphorus', 20)
        K = sensor_data.get('potassium', 150)
        
        nutrient_score = min(1.0, (N / 250 + P / 25 + K / 180) / 3)
        
        # Weather impact
        temp = weather_data.get('temperature', 25)
        temp_score = 1.0 if 18 <= temp <= 30 else max(0.6, 1.0 - abs(temp - 24) / 24)
        
        # Combined score
        overall_health = (moisture_score * 0.3 + health_score * 0.25 + 
                         stress_score * 0.2 + nutrient_score * 0.15 + 
                         temp_score * 0.1)
        
        estimated_yield = base_yield * overall_health
        
        # Quality assessment
        if overall_health >= 0.85:
            quality = "EXCELLENT"
            confidence = "HIGH"
        elif overall_health >= 0.70:
            quality = "GOOD"
            confidence = "MEDIUM"
        elif overall_health >= 0.55:
            quality = "FAIR"
            confidence = "MEDIUM"
        else:
            quality = "POOR"
            confidence = "LOW"
        
        return {
            'estimated_yield_kg_per_hectare': round(estimated_yield, 2),
            'quality_grade': quality,
            'confidence': confidence,
            'health_score': round(overall_health * 100, 1),
            'factors': {
                'soil_moisture': round(moisture_score * 100, 1),
                'leaf_health': round(health_score * 100, 1),
                'stress_management': round(stress_score * 100, 1),
                'nutrient_balance': round(nutrient_score * 100, 1),
                'temperature': round(temp_score * 100, 1)
            },
            'recommendations': self._get_yield_recommendations(overall_health, sensor_data, weather_data)
        }
    
    def _get_yield_recommendations(self, health_score, sensor_data, weather_data):
        """Get recommendations to improve yield"""
        recommendations = []
        
        if sensor_data.get('soil_moisture', 50) < 40:
            recommendations.append("Increase irrigation to improve yield")
        elif sensor_data.get('soil_moisture', 50) > 75:
            recommendations.append("Reduce irrigation to prevent waterlogging")
        
        if sensor_data.get('nitrogen', 200) < 180:
            recommendations.append("Apply nitrogen fertilizer to boost vegetative growth")
        
        if sensor_data.get('leaf_health', 80) < 75:
            recommendations.append("Address leaf health issues with nutrient foliar spray")
        
        if sensor_data.get('stress_level', 0) > 6:
            recommendations.append("Investigate and mitigate stress factors (pests, disease, drought)")
        
        if weather_data.get('temperature', 25) > 35:
            recommendations.append("Provide shade or cooling measures during extreme heat")
        
        if health_score >= 0.85:
            recommendations.append("Maintain current management practices - crops are thriving!")
        
        return recommendations
    
    def get_weather_based_recommendations(self, weather_forecast):
        """
        Generate recommendations based on weather forecast
        weather_forecast: list of upcoming weather data
        """
        recommendations = []
        alerts = []
        
        # Analyze forecast for next 3-7 days
        for i, forecast in enumerate(weather_forecast[:7]):
            day = f"Day {i+1}"
            temp = forecast.get('temp', 25)
            rainfall = forecast.get('rainfall', 0)
            humidity = forecast.get('humidity', 50)
            wind = forecast.get('wind', 5)
            
            # High temperature alert
            if temp > 38:
                alerts.append({
                    'day': day,
                    'type': 'HEAT_WAVE',
                    'severity': 'HIGH',
                    'message': f'Extreme heat expected ({temp}°C)',
                    'action': 'Increase irrigation frequency, provide shade, harvest mature crops'
                })
            
            # Heavy rainfall alert
            if rainfall > 50:
                alerts.append({
                    'day': day,
                    'type': 'HEAVY_RAIN',
                    'severity': 'HIGH',
                    'message': f'Heavy rainfall expected ({rainfall}mm)',
                    'action': 'Ensure drainage, postpone irrigation, harvest ready crops, protect from flooding'
                })
            elif rainfall > 20:
                recommendations.append(f"{day}: Moderate rain expected - reduce or skip irrigation")
            
            # Frost warning (if temperature drops too low)
            if temp < 5:
                alerts.append({
                    'day': day,
                    'type': 'FROST',
                    'severity': 'HIGH',
                    'message': f'Frost risk ({temp}°C)',
                    'action': 'Cover sensitive crops, harvest frost-sensitive vegetables, use frost protection'
                })
            
            # Strong wind warning
            if wind > 40:
                alerts.append({
                    'day': day,
                    'type': 'STRONG_WIND',
                    'severity': 'MEDIUM',
                    'message': f'Strong winds expected ({wind} km/h)',
                    'action': 'Stake tall plants, secure equipment, avoid pesticide application'
                })
        
        return {
            'recommendations': recommendations,
            'alerts': alerts,
            'forecast_days': len(weather_forecast)
        }
    
    def get_comprehensive_prediction(self, sensor_data, weather_data, 
                                    weather_forecast=None, crop_type='general'):
        """
        Get comprehensive prediction including:
        - Irrigation & fertilizer recommendations
        - Disease risk assessment
        - Pest risk assessment
        - Yield estimation
        - Weather-based recommendations
        """
        predictions = {}
        
        # Basic predictions (if model is loaded)
        try:
            if self.model and self.feature_config:
                from ml.predict import prepare_input_features
                input_df = prepare_input_features(sensor_data, weather_data, 
                                                  self.feature_config['feature_columns'])
                raw_predictions = self.model.predict(input_df)[0]
                
                predictions['irrigation_liters'] = float(max(0, raw_predictions[0]))
                predictions['fertilizer_N_g'] = float(max(0, raw_predictions[1]))
                predictions['fertilizer_P_g'] = float(max(0, raw_predictions[2]))
                predictions['fertilizer_K_g'] = float(max(0, raw_predictions[3]))
            else:
                # Fallback basic predictions when model not loaded
                print("Model not loaded, using fallback predictions")
                predictions['irrigation_liters'] = 300.0
                predictions['fertilizer_N_g'] = 150.0
                predictions['fertilizer_P_g'] = 75.0
                predictions['fertilizer_K_g'] = 100.0
        except Exception as e:
            print(f"Error in model prediction, using fallback: {str(e)}")
            # Fallback basic predictions on error
            predictions['irrigation_liters'] = 300.0
            predictions['fertilizer_N_g'] = 150.0
            predictions['fertilizer_P_g'] = 75.0
            predictions['fertilizer_K_g'] = 100.0
        
        # Advanced predictions
        disease_prediction = self.predict_disease_risk(sensor_data, weather_data)
        pest_prediction = self.predict_pest_risk(sensor_data, weather_data)
        yield_prediction = self.predict_yield(sensor_data, weather_data, crop_type)
        
        weather_recommendations = {}
        if weather_forecast:
            weather_recommendations = self.get_weather_based_recommendations(weather_forecast)
        
        return {
            'basic_recommendations': predictions,
            'disease_risk': disease_prediction,
            'pest_risk': pest_prediction,
            'yield_forecast': yield_prediction,
            'weather_advice': weather_recommendations,
            'generated_at': datetime.now().isoformat(),
            'confidence_score': self._calculate_confidence(sensor_data, weather_data)
        }
    
    def _calculate_confidence(self, sensor_data, weather_data):
        """Calculate confidence score for predictions"""
        data_completeness = 0
        total_fields = 0
        
        expected_sensor_fields = ['soil_moisture', 'nitrogen', 'phosphorus', 'potassium', 
                                  'ph', 'leaf_health', 'stress_level']
        expected_weather_fields = ['temperature', 'humidity', 'rainfall']
        
        for field in expected_sensor_fields:
            total_fields += 1
            if field in sensor_data and sensor_data[field] is not None:
                data_completeness += 1
        
        for field in expected_weather_fields:
            total_fields += 1
            if field in weather_data and weather_data[field] is not None:
                data_completeness += 1
        
        confidence = (data_completeness / total_fields) * 100
        
        if confidence >= 90:
            return {'score': confidence, 'level': 'HIGH'}
        elif confidence >= 70:
            return {'score': confidence, 'level': 'MEDIUM'}
        else:
            return {'score': confidence, 'level': 'LOW'}
