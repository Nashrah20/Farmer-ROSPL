"""
Crop Prediction Module
Author: FarmAI System

This module provides functions to predict crops based on environmental 
and soil conditions using the trained machine learning model.
"""

import pickle
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

class CropPredictor:
    """
    Crop prediction class that handles loading model and making predictions.
    """
    
    def __init__(self, model_path='crop_model.pkl', preprocessing_path='preprocessing.pkl'):
        """
        Initialize the predictor by loading model and preprocessing artifacts.
        
        Args:
            model_path: Path to the trained model file
            preprocessing_path: Path to preprocessing artifacts file
        """
        print(f"🔄 Loading model and preprocessing artifacts...")
        
        try:
            # Load model
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print(f"   ✅ Model loaded from {model_path}")
            
            # Load preprocessing data
            with open(preprocessing_path, 'rb') as f:
                preprocessing = pickle.load(f)
            
            self.scaler = preprocessing['scaler']
            self.label_encoder = preprocessing['label_encoder']
            self.feature_columns = preprocessing['feature_columns']
            self.crop_classes = preprocessing['crop_classes']
            self.season_columns = preprocessing['season_columns']
            self.soil_columns = preprocessing.get('soil_columns', [])
            
            print(f"   ✅ Preprocessing loaded from {preprocessing_path}")
            print(f"   📊 Crops supported: {len(self.crop_classes)}")
            
        except FileNotFoundError as e:
            print(f"❌ Error: Required files not found. Please run train_crop_model.py first.")
            raise e
    
    def _preprocess_input(self, air_temp, humidity, soil_moisture, soil_temp, 
                          nitrogen, phosphorus, potassium, season, soil_type='black_soil'):
        """
        Preprocess input data to match training format.
        
        Args:
            air_temp: Air temperature in Celsius
            humidity: Humidity percentage
            soil_moisture: Soil moisture percentage
            soil_temp: Soil temperature in Celsius
            nitrogen: Nitrogen content (mg/kg)
            phosphorus: Phosphorus content (mg/kg)
            potassium: Potassium content (mg/kg)
            season: Season name (e.g., 'kharif', 'rabi', 'zaid')
            soil_type: Soil type (e.g., 'black_soil', 'red_soil', 'laterite_soil', 'alluvial_soil', 'saline_soil')
        
        Returns:
            Scaled numpy array ready for prediction
        """
        # Create DataFrame with input data
        input_data = pd.DataFrame({
            'air_temp (°C)': [air_temp],
            'humidity (%)': [humidity],
            'soil_moisture (%)': [soil_moisture],
            'soil_temp (°C)': [soil_temp],
            'nitrogen (mg/kg)': [nitrogen],
            'phosphorus (mg/kg)': [phosphorus],
            'potassium (mg/kg)': [potassium]
        })
        
        # One-hot encode season
        for season_col in self.season_columns:
            season_name = season_col.replace('season_', '')
            input_data[season_col] = 1 if season.lower() == season_name.lower() else 0
        
        # One-hot encode soil type
        for soil_col in self.soil_columns:
            soil_name = soil_col.replace('soil_', '')
            input_data[soil_col] = 1 if soil_type.lower() == soil_name.lower() else 0
        
        # Ensure columns match training data
        input_data = input_data[self.feature_columns]
        
        # Scale features
        input_scaled = self.scaler.transform(input_data)
        
        return input_scaled
    
    def predict_crop(self, air_temp: float, humidity: float, soil_moisture: float, 
                     soil_temp: float, nitrogen: float, phosphorus: float, 
                     potassium: float, season: str, soil_type: str = 'black_soil') -> Dict:
        """
        Predict the best crop based on environmental and soil conditions.
        
        Args:
            air_temp: Air temperature in Celsius (e.g., 25.5)
            humidity: Humidity percentage (e.g., 65.0)
            soil_moisture: Soil moisture percentage (e.g., 45.0)
            soil_temp: Soil temperature in Celsius (e.g., 22.0)
            nitrogen: Nitrogen content in mg/kg (e.g., 80.0)
            phosphorus: Phosphorus content in mg/kg (e.g., 50.0)
            potassium: Potassium content in mg/kg (e.g., 60.0)
            season: Season name - 'kharif', 'rabi', or 'zaid'
            soil_type: Soil type - 'black_soil', 'red_soil', 'laterite_soil', 'alluvial_soil', or 'saline_soil'
        
        Returns:
            Dictionary containing:
                - predicted_crop: Name of predicted crop
                - confidence: Prediction confidence (0-1)
                - top_3_crops: List of top 3 recommended crops with probabilities
                - input_summary: Summary of input parameters
        """
        # Validate season
        valid_seasons = [col.replace('season_', '') for col in self.season_columns]
        if season.lower() not in valid_seasons:
            raise ValueError(f"Invalid season. Must be one of: {valid_seasons}")
        
        # Preprocess input
        input_scaled = self._preprocess_input(
            air_temp, humidity, soil_moisture, soil_temp,
            nitrogen, phosphorus, potassium, season, soil_type
        )
        
        # Get prediction
        prediction = self.model.predict(input_scaled)[0]
        predicted_crop = self.label_encoder.inverse_transform([prediction])[0]
        
        # Get probabilities
        if hasattr(self.model, 'predict_proba'):
            probabilities = self.model.predict_proba(input_scaled)[0]
            confidence = float(probabilities[prediction])
            
            # Get top 3 crops
            top_3_indices = np.argsort(probabilities)[::-1][:3]
            top_3_crops = [
                {
                    'crop': self.label_encoder.inverse_transform([idx])[0],
                    'probability': float(probabilities[idx]),
                    'confidence_percent': f"{probabilities[idx]*100:.2f}%"
                }
                for idx in top_3_indices
            ]
        else:
            confidence = 1.0
            top_3_crops = [
                {
                    'crop': predicted_crop,
                    'probability': 1.0,
                    'confidence_percent': "100.00%"
                }
            ]
        
        # Prepare result
        result = {
            'predicted_crop': predicted_crop,
            'confidence': confidence,
            'confidence_percent': f"{confidence*100:.2f}%",
            'top_3_crops': top_3_crops,
            'input_summary': {
                'air_temperature': f"{air_temp}°C",
                'humidity': f"{humidity}%",
                'soil_moisture': f"{soil_moisture}%",
                'soil_temperature': f"{soil_temp}°C",
                'nitrogen': f"{nitrogen} mg/kg",
                'phosphorus': f"{phosphorus} mg/kg",
                'potassium': f"{potassium} mg/kg",
                'season': season,
                'soil_type': soil_type.replace('_', ' ').title()
            }
        }
        
        return result
    
    def predict_batch(self, input_list: List[Dict]) -> List[Dict]:
        """
        Predict crops for multiple inputs at once.
        
        Args:
            input_list: List of dictionaries, each containing:
                {air_temp, humidity, soil_moisture, soil_temp, nitrogen, 
                 phosphorus, potassium, season}
        
        Returns:
            List of prediction results
        """
        results = []
        for input_data in input_list:
            try:
                result = self.predict_crop(**input_data)
                results.append(result)
            except Exception as e:
                results.append({
                    'error': str(e),
                    'input': input_data
                })
        return results
    
    def get_crop_requirements(self, crop_name: str) -> Dict:
        """
        Get ideal conditions for a specific crop (if available).
        This would require additional crop knowledge database.
        
        Args:
            crop_name: Name of the crop
        
        Returns:
            Dictionary with ideal conditions (placeholder)
        """
        if crop_name not in self.crop_classes:
            return {'error': f'Crop "{crop_name}" not found in database'}
        
        return {
            'crop': crop_name,
            'message': 'Crop requirements database not yet implemented',
            'suggestion': 'Use historical data analysis to determine ideal ranges'
        }


def predict_crop(air_temp: float, humidity: float, soil_moisture: float, 
                 soil_temp: float, nitrogen: float, phosphorus: float, 
                 potassium: float, season: str) -> Dict:
    """
    Convenience function to make a single prediction without managing predictor instance.
    
    Args:
        air_temp: Air temperature in Celsius
        humidity: Humidity percentage
        soil_moisture: Soil moisture percentage
        soil_temp: Soil temperature in Celsius
        nitrogen: Nitrogen content (mg/kg)
        phosphorus: Phosphorus content (mg/kg)
        potassium: Potassium content (mg/kg)
        season: Season ('kharif', 'rabi', 'zaid')
    
    Returns:
        Prediction result dictionary
    """
    predictor = CropPredictor()
    return predictor.predict_crop(
        air_temp, humidity, soil_moisture, soil_temp,
        nitrogen, phosphorus, potassium, season
    )


if __name__ == "__main__":
    # Example usage
    print("="*70)
    print("🌾 CROP PREDICTOR - Example Usage")
    print("="*70)
    
    # Initialize predictor
    predictor = CropPredictor()
    
    # Example 1: Kharif season prediction
    print("\n📋 Example 1: Kharif Season Prediction")
    result1 = predictor.predict_crop(
        air_temp=32.5,
        humidity=75.0,
        soil_moisture=55.0,
        soil_temp=28.5,
        nitrogen=130.0,
        phosphorus=60.0,
        potassium=85.0,
        season='kharif'
    )
    
    print(f"\n🎯 Predicted Crop: {result1['predicted_crop']}")
    print(f"✅ Confidence: {result1['confidence_percent']}")
    print(f"\n🏆 Top 3 Recommendations:")
    for i, crop in enumerate(result1['top_3_crops'], 1):
        print(f"   {i}. {crop['crop']}: {crop['confidence_percent']}")
    
    # Example 2: Rabi season prediction
    print("\n" + "="*70)
    print("📋 Example 2: Rabi Season Prediction")
    result2 = predictor.predict_crop(
        air_temp=20.0,
        humidity=50.0,
        soil_moisture=40.0,
        soil_temp=16.0,
        nitrogen=90.0,
        phosphorus=70.0,
        potassium=60.0,
        season='rabi'
    )
    
    print(f"\n🎯 Predicted Crop: {result2['predicted_crop']}")
    print(f"✅ Confidence: {result2['confidence_percent']}")
    print(f"\n🏆 Top 3 Recommendations:")
    for i, crop in enumerate(result2['top_3_crops'], 1):
        print(f"   {i}. {crop['crop']}: {crop['confidence_percent']}")
    
    print("\n" + "="*70)
    print("✅ Prediction examples completed!")
    print("="*70)
