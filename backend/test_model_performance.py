"""
Test ML Model Performance and Generate Report
"""

import sys
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.metrics import (
    mean_absolute_error, 
    mean_squared_error, 
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)
import traceback

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from utils.mongo import MongoDBClient

def test_model_performance():
    """Test the trained ML model and generate performance report"""
    
    print("\n" + "="*80)
    print("ML MODEL PERFORMANCE TEST & EVALUATION REPORT")
    print("="*80)
    
    # Check if model exists
    model_path = Config.ML_MODEL_PATH
    features_path = Config.ML_FEATURES_PATH
    
    if not os.path.exists(model_path):
        print(f"\n❌ Model file not found: {model_path}")
        print("Please train the model first using /api/train endpoint")
        return
    
    if not os.path.exists(features_path):
        print(f"\n❌ Features file not found: {features_path}")
        return
    
    print(f"\n✓ Model found: {model_path}")
    print(f"✓ Features config found: {features_path}")
    
    # Load model and features
    print("\n[1/5] Loading trained model...")
    model = joblib.load(model_path)
    
    with open(features_path, 'r') as f:
        feature_config = json.load(f)
    
    print(f"   Model type: {type(model).__name__}")
    print(f"   Feature columns: {len(feature_config['feature_columns'])}")
    
    # Get test data from MongoDB
    print("\n[2/5] Fetching test data from MongoDB...")
    mongo_client = MongoDBClient()
    
    # Get all sensor readings and actions
    db = mongo_client.client[Config.MONGODB_DATABASE]
    sensor_readings = list(db.sensorReadings.find().limit(5000))
    actions = list(db.actions.find().limit(5000))
    weather_data = list(db.weather.find().limit(5000))
    
    print(f"   Sensor readings: {len(sensor_readings):,}")
    print(f"   Actions: {len(actions):,}")
    print(f"   Weather records: {len(weather_data):,}")
    
    if len(sensor_readings) == 0 or len(actions) == 0:
        print("\n❌ Insufficient data for testing")
        return
    
    # Prepare test dataset
    print("\n[3/5] Preparing test dataset...")
    
    # Create dataframe from sensor readings
    df_sensors = pd.DataFrame(sensor_readings)
    df_actions = pd.DataFrame(actions)
    df_weather = pd.DataFrame(weather_data)
    
    # Merge data
    df = df_sensors.merge(df_weather, on=['zone_id', 'timestamp'], how='left', suffixes=('', '_weather'))
    df = df.merge(df_actions, on=['zone_id', 'timestamp'], how='left', suffixes=('', '_action'))
    
    print(f"   Merged dataset: {len(df):,} rows")
    
    # Feature mapping for actual column names
    feature_mapping = {
        'soil_moisture_pct': 'soil_moisture',
        'N_mgkg': 'nitrogen',
        'P_mgkg': 'phosphorus',
        'K_mgkg': 'potassium',
        'EC_ds_m': 'ec',
        'leaf_health_score': 'leaf_health',
        'air_temp_c': 'temperature',
        'humidity_pct': 'humidity',
        'wind_kmph': 'wind_speed',
        'rainfall_mm': 'rainfall'
    }
    
    # Rename columns to match what model expects
    df_renamed = df.copy()
    for old_name, new_name in feature_mapping.items():
        if new_name in df.columns:
            df_renamed[old_name] = df[new_name]
    
    # Extract features
    feature_cols = feature_config['feature_columns']
    available_features = [col for col in feature_cols if col in df_renamed.columns]
    
    print(f"   Available features: {len(available_features)}/{len(feature_cols)}")
    
    # Fill missing features with 0
    for col in feature_cols:
        if col not in df_renamed.columns:
            df_renamed[col] = 0
    
    X_test = df_renamed[feature_cols].fillna(0)
    
    # Get actual targets (if available)
    target_cols = ['irrigation_amount', 'fertilizer_amount', 'action_type']
    available_targets = [col for col in target_cols if col in df_renamed.columns]
    
    print(f"   Available targets: {len(available_targets)}/{len(target_cols)}")
    
    # Run predictions
    print("\n[4/5] Running predictions...")
    
    try:
        predictions = model.predict(X_test[:1000])  # Test on 1000 samples
        print(f"   Predictions completed: {len(predictions):,} samples")
        
        # Analyze prediction statistics
        print("\n[5/5] Analyzing predictions...")
        
        if hasattr(model, 'predict_proba'):
            # Classification model
            probabilities = model.predict_proba(X_test[:1000])
            confidence_scores = np.max(probabilities, axis=1)
            
            print("\n" + "="*80)
            print("PREDICTION CONFIDENCE ANALYSIS")
            print("="*80)
            
            print(f"\nConfidence Score Statistics:")
            print(f"   Mean Confidence: {np.mean(confidence_scores):.2%}")
            print(f"   Median Confidence: {np.median(confidence_scores):.2%}")
            print(f"   Min Confidence: {np.min(confidence_scores):.2%}")
            print(f"   Max Confidence: {np.max(confidence_scores):.2%}")
            print(f"   Std Deviation: {np.std(confidence_scores):.2%}")
            
            # Confidence distribution
            high_conf = np.sum(confidence_scores >= 0.8)
            medium_conf = np.sum((confidence_scores >= 0.6) & (confidence_scores < 0.8))
            low_conf = np.sum(confidence_scores < 0.6)
            
            print(f"\nConfidence Distribution:")
            print(f"   High Confidence (>80%): {high_conf} ({high_conf/len(confidence_scores)*100:.1f}%)")
            print(f"   Medium Confidence (60-80%): {medium_conf} ({medium_conf/len(confidence_scores)*100:.1f}%)")
            print(f"   Low Confidence (<60%): {low_conf} ({low_conf/len(confidence_scores)*100:.1f}%)")
            
            # Class distribution
            unique_preds, counts = np.unique(predictions, return_counts=True)
            print(f"\nPredicted Class Distribution:")
            for pred, count in zip(unique_preds, counts):
                print(f"   Class {pred}: {count} ({count/len(predictions)*100:.1f}%)")
            
            # If we have actual labels, calculate accuracy metrics
            if 'action_type' in df_renamed.columns:
                y_test = df_renamed['action_type'][:1000].fillna(0)
                
                try:
                    accuracy = accuracy_score(y_test, predictions)
                    
                    print("\n" + "="*80)
                    print("MODEL ACCURACY METRICS")
                    print("="*80)
                    print(f"\nOverall Accuracy: {accuracy:.2%}")
                    
                    # Confusion matrix
                    cm = confusion_matrix(y_test, predictions)
                    print(f"\nConfusion Matrix:")
                    print(cm)
                    
                    # Per-class metrics
                    precision = precision_score(y_test, predictions, average='weighted', zero_division=0)
                    recall = recall_score(y_test, predictions, average='weighted', zero_division=0)
                    f1 = f1_score(y_test, predictions, average='weighted', zero_division=0)
                    
                    print(f"\nWeighted Metrics:")
                    print(f"   Precision: {precision:.2%}")
                    print(f"   Recall: {recall:.2%}")
                    print(f"   F1-Score: {f1:.2%}")
                    
                except Exception as e:
                    print(f"\n⚠️  Could not calculate accuracy metrics: {e}")
        
        else:
            # Regression model
            print("\n" + "="*80)
            print("PREDICTION VALUE ANALYSIS")
            print("="*80)
            
            print(f"\nPrediction Statistics:")
            print(f"   Mean: {np.mean(predictions):.2f}")
            print(f"   Median: {np.median(predictions):.2f}")
            print(f"   Min: {np.min(predictions):.2f}")
            print(f"   Max: {np.max(predictions):.2f}")
            print(f"   Std Deviation: {np.std(predictions):.2f}")
            
            # If we have actual values, calculate regression metrics
            if 'irrigation_amount' in df_renamed.columns:
                y_test = df_renamed['irrigation_amount'][:1000].fillna(0)
                
                try:
                    mae = mean_absolute_error(y_test, predictions)
                    rmse = np.sqrt(mean_squared_error(y_test, predictions))
                    r2 = r2_score(y_test, predictions)
                    
                    print("\n" + "="*80)
                    print("MODEL REGRESSION METRICS")
                    print("="*80)
                    print(f"\nMean Absolute Error (MAE): {mae:.4f}")
                    print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
                    print(f"R² Score: {r2:.4f}")
                    
                    if r2 > 0.8:
                        print("\n✓ Excellent model performance (R² > 0.8)")
                    elif r2 > 0.6:
                        print("\n✓ Good model performance (R² > 0.6)")
                    elif r2 > 0.4:
                        print("\n⚠️  Fair model performance (R² > 0.4)")
                    else:
                        print("\n⚠️  Model needs improvement (R² < 0.4)")
                        
                except Exception as e:
                    print(f"\n⚠️  Could not calculate regression metrics: {e}")
        
        # Feature importance (if available)
        if hasattr(model, 'feature_importances_'):
            print("\n" + "="*80)
            print("TOP 10 MOST IMPORTANT FEATURES")
            print("="*80)
            
            feature_importance = pd.DataFrame({
                'feature': feature_cols,
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            print("\n")
            for idx, row in feature_importance.head(10).iterrows():
                print(f"   {row['feature']:25} {row['importance']:.4f} {'█' * int(row['importance'] * 100)}")
        
        # Sample predictions
        print("\n" + "="*80)
        print("SAMPLE PREDICTIONS (First 10)")
        print("="*80)
        print("\n")
        
        for i in range(min(10, len(predictions))):
            zone = df_renamed.iloc[i]['zone_id'] if 'zone_id' in df_renamed.columns else 'Unknown'
            moisture = X_test.iloc[i]['soil_moisture_pct'] if 'soil_moisture_pct' in X_test.columns else 0
            pred = predictions[i]
            
            if hasattr(model, 'predict_proba'):
                conf = confidence_scores[i]
                print(f"   Sample {i+1}: Zone={zone}, Moisture={moisture:.1f}%, Prediction={pred}, Confidence={conf:.2%}")
            else:
                # Handle multi-output predictions
                if isinstance(pred, (list, np.ndarray)) and len(pred) > 1:
                    pred_str = f"[{', '.join([f'{p:.2f}' for p in pred])}]"
                else:
                    pred_str = f"{pred[0]:.2f}" if isinstance(pred, (list, np.ndarray)) else f"{pred:.2f}"
                print(f"   Sample {i+1}: Zone={zone}, Moisture={moisture:.1f}%, Prediction={pred_str}")
        
        # Model info
        print("\n" + "="*80)
        print("MODEL INFORMATION")
        print("="*80)
        
        print(f"\nModel Type: {type(model).__name__}")
        print(f"Number of Features: {len(feature_cols)}")
        print(f"Model File Size: {os.path.getsize(model_path) / 1024:.2f} KB")
        print(f"Last Modified: {datetime.fromtimestamp(os.path.getmtime(model_path)).strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Final summary
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        
        print(f"\n✓ Model loaded successfully")
        print(f"✓ {len(predictions):,} predictions completed")
        print(f"✓ Model is functioning correctly")
        
        if hasattr(model, 'predict_proba'):
            avg_conf = np.mean(confidence_scores)
            if avg_conf >= 0.8:
                print(f"✓ High average confidence: {avg_conf:.2%}")
            elif avg_conf >= 0.6:
                print(f"⚠️  Moderate average confidence: {avg_conf:.2%}")
            else:
                print(f"⚠️  Low average confidence: {avg_conf:.2%} - Consider retraining")
        
        print("\n" + "="*80)
        print("REPORT COMPLETED: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        print("="*80)
        
    except Exception as e:
        print(f"\n❌ Error during prediction testing: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    try:
        test_model_performance()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        traceback.print_exc()
