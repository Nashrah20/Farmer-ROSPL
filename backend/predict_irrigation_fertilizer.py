"""
Irrigation and Fertilizer Prediction Module

This module provides predictions for:
1. Irrigation amount (liters) needed
2. Fertilizer NPK amounts (N, P, K in grams) needed

Based on current sensor readings and crop information.
"""

import pickle
import numpy as np
import pandas as pd
from datetime import datetime


class IrrigationFertilizerPredictor:
    """Predict irrigation and fertilizer requirements based on sensor data"""
    
    def __init__(self, model_dir=''):
        """Initialize the predictor by loading trained models"""
        print("🔧 Initializing Irrigation & Fertilizer Predictor...")
        
        # Load models
        try:
            with open(f'{model_dir}irrigation_model.pkl', 'rb') as f:
                self.irrigation_model = pickle.load(f)
            print("   ✅ Loaded irrigation model")
        except FileNotFoundError:
            raise FileNotFoundError("❌ irrigation_model.pkl not found. Please train the model first.")
        
        try:
            with open(f'{model_dir}fertilizer_model.pkl', 'rb') as f:
                fertilizer_models = pickle.load(f)
                self.nitrogen_model = fertilizer_models['nitrogen']
                self.phosphorus_model = fertilizer_models['phosphorus']
                self.potassium_model = fertilizer_models['potassium']
            print("   ✅ Loaded fertilizer models (N, P, K)")
        except FileNotFoundError:
            raise FileNotFoundError("❌ fertilizer_model.pkl not found. Please train the model first.")
        
        try:
            with open(f'{model_dir}irrigation_fertilizer_preprocessing.pkl', 'rb') as f:
                preprocessing = pickle.load(f)
                self.irrigation_scaler = preprocessing['irrigation_scaler']
                self.nitrogen_scaler = preprocessing['nitrogen_scaler']
                self.phosphorus_scaler = preprocessing['phosphorus_scaler']
                self.potassium_scaler = preprocessing['potassium_scaler']
                self.feature_columns = preprocessing['feature_columns']
                self.label_encoders = preprocessing['label_encoders']
                self.models_info = preprocessing['models_info']
            print("   ✅ Loaded preprocessing artifacts")
        except FileNotFoundError:
            raise FileNotFoundError("❌ irrigation_fertilizer_preprocessing.pkl not found.")
        
        print("✅ Irrigation & Fertilizer Predictor initialized successfully")
    
    def _encode_categorical(self, value, feature_name):
        """Encode categorical value using fitted label encoder"""
        try:
            # Remove '_encoded' suffix to get original feature name
            original_name = feature_name.replace('_encoded', '')
            if original_name in self.label_encoders:
                encoder = self.label_encoders[original_name]
                if value in encoder.classes_:
                    return encoder.transform([value])[0]
                else:
                    # Return most common class if value not seen during training
                    print(f"   ⚠️  Unknown value '{value}' for {original_name}, using default")
                    return 0
            return 0
        except Exception as e:
            print(f"   ⚠️  Error encoding {feature_name}: {e}")
            return 0
    
    def _preprocess_input(self, soil_moisture, soil_temp, air_temp, humidity, wind, 
                         rainfall, ph, ec, nitrogen, phosphorus, potassium, ndvi, 
                         leaf_health, stress_level, soil_type, crop, crop_stage, region):
        """Preprocess input features to match training format"""
        
        # Create feature dictionary
        features = {
            'soil_moisture_pct': float(soil_moisture),
            'soil_temp_c': float(soil_temp),
            'air_temp_c': float(air_temp),
            'humidity_pct': float(humidity),
            'wind_kmph': float(wind),
            'rainfall_mm': float(rainfall),
            'ph': float(ph),
            'EC_ds_m': float(ec),
            'N_mgkg': float(nitrogen),
            'P_mgkg': float(phosphorus),
            'K_mgkg': float(potassium),
            'NDVI': float(ndvi),
            'leaf_health_score': float(leaf_health),
            'stress_level': float(stress_level),
            'soil_type_encoded': self._encode_categorical(soil_type, 'soil_type_encoded'),
            'crop_encoded': self._encode_categorical(crop, 'crop_encoded'),
            'crop_stage_encoded': self._encode_categorical(crop_stage, 'crop_stage_encoded'),
            'region_encoded': self._encode_categorical(region, 'region_encoded')
        }
        
        # Create DataFrame with correct column order
        input_df = pd.DataFrame([features])
        input_df = input_df[self.feature_columns]
        
        return input_df
    
    def predict(self, soil_moisture, soil_temp, air_temp, humidity, wind=0, rainfall=0,
               ph=7.0, ec=0.4, nitrogen=50, phosphorus=20, potassium=150, 
               ndvi=0.5, leaf_health=85, stress_level=5,
               soil_type='coarse', crop='wheat', crop_stage='Growing', region='NorthMaha'):
        """
        Predict irrigation and fertilizer requirements
        
        Parameters:
        -----------
        Required sensor readings:
        - soil_moisture: Soil moisture percentage (0-100)
        - soil_temp: Soil temperature in Celsius
        - air_temp: Air temperature in Celsius
        - humidity: Relative humidity percentage (0-100)
        
        Optional parameters (with defaults):
        - wind: Wind speed in km/h (default: 0)
        - rainfall: Rainfall in mm (default: 0)
        - ph: Soil pH (default: 7.0)
        - ec: Electrical conductivity in dS/m (default: 0.4)
        - nitrogen: Nitrogen level in mg/kg (default: 50)
        - phosphorus: Phosphorus level in mg/kg (default: 20)
        - potassium: Potassium level in mg/kg (default: 150)
        - ndvi: Normalized Difference Vegetation Index (default: 0.5)
        - leaf_health: Leaf health score 0-100 (default: 85)
        - stress_level: Plant stress level 0-100 (default: 5)
        - soil_type: Type of soil (default: 'coarse')
        - crop: Crop type (default: 'wheat')
        - crop_stage: Growth stage (default: 'Growing')
        - region: Geographic region (default: 'NorthMaha')
        
        Returns:
        --------
        Dictionary with predictions and recommendations
        """
        
        try:
            # Preprocess input
            input_features = self._preprocess_input(
                soil_moisture, soil_temp, air_temp, humidity, wind, rainfall,
                ph, ec, nitrogen, phosphorus, potassium, ndvi, leaf_health, 
                stress_level, soil_type, crop, crop_stage, region
            )
            
            # Make predictions
            # Irrigation
            irrigation_scaled = self.irrigation_scaler.transform(input_features)
            irrigation_liters = float(self.irrigation_model.predict(irrigation_scaled)[0])
            irrigation_liters = max(0, irrigation_liters)  # Ensure non-negative
            
            # Nitrogen
            nitrogen_scaled = self.nitrogen_scaler.transform(input_features)
            nitrogen_g = float(self.nitrogen_model.predict(nitrogen_scaled)[0])
            nitrogen_g = max(0, nitrogen_g)
            
            # Phosphorus
            phosphorus_scaled = self.phosphorus_scaler.transform(input_features)
            phosphorus_g = float(self.phosphorus_model.predict(phosphorus_scaled)[0])
            phosphorus_g = max(0, phosphorus_g)
            
            # Potassium
            potassium_scaled = self.potassium_scaler.transform(input_features)
            potassium_g = float(self.potassium_model.predict(potassium_scaled)[0])
            potassium_g = max(0, potassium_g)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                irrigation_liters, nitrogen_g, phosphorus_g, potassium_g,
                soil_moisture, leaf_health, stress_level, crop_stage
            )
            
            # Build result
            result = {
                'irrigation': {
                    'amount_liters': round(irrigation_liters, 2),
                    'recommendation': self._get_irrigation_recommendation(irrigation_liters, soil_moisture)
                },
                'fertilizer': {
                    'nitrogen_g': round(nitrogen_g, 2),
                    'phosphorus_g': round(phosphorus_g, 2),
                    'potassium_g': round(potassium_g, 2),
                    'total_npk_g': round(nitrogen_g + phosphorus_g + potassium_g, 2),
                    'npk_ratio': self._calculate_npk_ratio(nitrogen_g, phosphorus_g, potassium_g)
                },
                'recommendations': recommendations,
                'input_summary': {
                    'crop': crop,
                    'crop_stage': crop_stage,
                    'soil_type': soil_type,
                    'soil_moisture': soil_moisture,
                    'soil_temp': soil_temp,
                    'air_temp': air_temp,
                    'humidity': humidity,
                    'leaf_health': leaf_health,
                    'stress_level': stress_level
                },
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'model_info': {
                    'irrigation_model': self.models_info['irrigation']['model_name'],
                    'nitrogen_model': self.models_info['nitrogen']['model_name'],
                    'phosphorus_model': self.models_info['phosphorus']['model_name'],
                    'potassium_model': self.models_info['potassium']['model_name']
                }
            }
            
            return result
            
        except Exception as e:
            return {
                'error': str(e),
                'message': 'Failed to generate predictions. Please check input parameters.'
            }
    
    def _get_irrigation_recommendation(self, liters, soil_moisture):
        """Generate irrigation recommendation text"""
        if soil_moisture < 30:
            urgency = "High Priority"
            action = "irrigate immediately"
        elif soil_moisture < 50:
            urgency = "Medium Priority"
            action = "irrigate soon"
        else:
            urgency = "Low Priority"
            action = "monitor soil moisture"
        
        if liters < 10:
            method = "light irrigation"
        elif liters < 20:
            method = "moderate irrigation"
        else:
            method = "heavy irrigation"
        
        return f"{urgency}: Apply {liters:.1f} liters using {method}. Current soil moisture is {soil_moisture:.1f}%, so {action}."
    
    def _calculate_npk_ratio(self, n, p, k):
        """Calculate NPK ratio"""
        total = n + p + k
        if total == 0:
            return "0:0:0"
        
        # Normalize to get ratio
        n_ratio = (n / total) * 100
        p_ratio = (p / total) * 100
        k_ratio = (k / total) * 100
        
        return f"{n_ratio:.0f}:{p_ratio:.0f}:{k_ratio:.0f}"
    
    def _generate_recommendations(self, irrigation, nitrogen, phosphorus, potassium,
                                 soil_moisture, leaf_health, stress_level, crop_stage):
        """Generate actionable recommendations"""
        recommendations = []
        
        # Irrigation recommendations
        if irrigation > 0:
            if soil_moisture < 30:
                recommendations.append({
                    'type': 'irrigation',
                    'priority': 'high',
                    'message': f'Immediate irrigation needed: {irrigation:.1f} liters. Soil moisture critically low at {soil_moisture:.1f}%.'
                })
            elif irrigation > 15:
                recommendations.append({
                    'type': 'irrigation',
                    'priority': 'medium',
                    'message': f'Apply {irrigation:.1f} liters of water. Use drip irrigation for best efficiency.'
                })
        
        # Fertilizer recommendations
        if nitrogen > 0 or phosphorus > 0 or potassium > 0:
            total_fertilizer = nitrogen + phosphorus + potassium
            if total_fertilizer > 50:
                recommendations.append({
                    'type': 'fertilizer',
                    'priority': 'high',
                    'message': f'Apply fertilizer: N={nitrogen:.1f}g, P={phosphorus:.1f}g, K={potassium:.1f}g. Total: {total_fertilizer:.1f}g'
                })
            elif total_fertilizer > 20:
                recommendations.append({
                    'type': 'fertilizer',
                    'priority': 'medium',
                    'message': f'Moderate fertilizer application needed: {total_fertilizer:.1f}g total NPK'
                })
        
        # Health recommendations
        if leaf_health < 70:
            recommendations.append({
                'type': 'health',
                'priority': 'high',
                'message': f'Leaf health is low ({leaf_health:.1f}%). Check for pests or diseases.'
            })
        
        if stress_level > 15:
            recommendations.append({
                'type': 'stress',
                'priority': 'high',
                'message': f'High stress level detected ({stress_level:.1f}). Monitor closely and adjust irrigation.'
            })
        
        # Stage-specific recommendations
        if crop_stage in ['Flowering', 'Fruiting']:
            recommendations.append({
                'type': 'stage',
                'priority': 'medium',
                'message': f'Critical {crop_stage} stage. Ensure adequate water and nutrients.'
            })
        
        return recommendations


# Test function
def test_predictor():
    """Test the predictor with sample data"""
    print("\n" + "="*70)
    print("🧪 TESTING IRRIGATION & FERTILIZER PREDICTOR")
    print("="*70)
    
    predictor = IrrigationFertilizerPredictor()
    
    # Test case 1: Low soil moisture
    print("\n📊 Test Case 1: Low soil moisture scenario")
    result1 = predictor.predict(
        soil_moisture=15,
        soil_temp=25,
        air_temp=28,
        humidity=45,
        wind=5,
        rainfall=0,
        crop='wheat',
        crop_stage='Growing',
        soil_type='coarse'
    )
    
    print(f"   Irrigation: {result1['irrigation']['amount_liters']} liters")
    print(f"   Fertilizer NPK: {result1['fertilizer']['nitrogen_g']}g N, "
          f"{result1['fertilizer']['phosphorus_g']}g P, {result1['fertilizer']['potassium_g']}g K")
    print(f"   NPK Ratio: {result1['fertilizer']['npk_ratio']}")
    print(f"   Recommendations: {len(result1['recommendations'])} items")
    
    # Test case 2: Good conditions
    print("\n📊 Test Case 2: Optimal conditions")
    result2 = predictor.predict(
        soil_moisture=65,
        soil_temp=22,
        air_temp=25,
        humidity=60,
        leaf_health=90,
        stress_level=2,
        crop='wheat',
        crop_stage='Growing'
    )
    
    print(f"   Irrigation: {result2['irrigation']['amount_liters']} liters")
    print(f"   Fertilizer NPK: {result2['fertilizer']['nitrogen_g']}g N, "
          f"{result2['fertilizer']['phosphorus_g']}g P, {result2['fertilizer']['potassium_g']}g K")
    
    print("\n✅ Testing complete!")


if __name__ == "__main__":
    test_predictor()
