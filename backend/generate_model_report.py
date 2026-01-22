"""
Comprehensive ML Model Probability Analysis Report
"""

import sys
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import Config
from utils.mongo import MongoDBClient

def generate_comprehensive_report():
    """Generate comprehensive probability and performance analysis"""
    
    print("\n" + "="*80)
    print("COMPREHENSIVE ML MODEL PROBABILITY & PERFORMANCE ANALYSIS")
    print("="*80)
    print(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load model
    model_path = Config.ML_MODEL_PATH
    features_path = Config.ML_FEATURES_PATH
    
    if not os.path.exists(model_path):
        print("\n❌ Model not found. Please train the model first.")
        return
    
    model = joblib.load(model_path)
    with open(features_path, 'r') as f:
        feature_config = json.load(f)
    
    print(f"\n✓ Model Type: {type(model).__name__}")
    
    # Load data
    mongo_client = MongoDBClient()
    db = mongo_client.client[Config.MONGODB_DATABASE]
    
    sensor_readings = list(db.sensorReadings.find().limit(10000))
    weather_data = list(db.weather.find().limit(10000))
    
    print(f"✓ Loaded {len(sensor_readings):,} sensor readings")
    print(f"✓ Loaded {len(weather_data):,} weather records")
    
    # Prepare dataset
    df_sensors = pd.DataFrame(sensor_readings)
    df_weather = pd.DataFrame(weather_data)
    df = df_sensors.merge(df_weather, on=['zone_id', 'timestamp'], how='left', suffixes=('', '_weather'))
    
    # Feature mapping
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
    
    df_renamed = df.copy()
    for old_name, new_name in feature_mapping.items():
        if new_name in df.columns:
            df_renamed[old_name] = df[new_name]
    
    feature_cols = feature_config['feature_columns']
    for col in feature_cols:
        if col not in df_renamed.columns:
            df_renamed[col] = 0
    
    X = df_renamed[feature_cols].fillna(0)
    
    # Make predictions on large sample
    print(f"\n[ANALYSIS] Running predictions on {len(X):,} samples...")
    predictions = model.predict(X)
    
    print("\n" + "="*80)
    print("1. PREDICTION DISTRIBUTION ANALYSIS")
    print("="*80)
    
    # Multi-output analysis
    if len(predictions.shape) > 1 and predictions.shape[1] > 1:
        output_names = ['Irrigation Amount', 'Fertilizer Amount', 'Parameter 3', 'Parameter 4']
        
        for i in range(predictions.shape[1]):
            output_values = predictions[:, i]
            
            print(f"\n📊 Output {i+1}: {output_names[i] if i < len(output_names) else f'Output {i+1}'}")
            print(f"   Mean: {np.mean(output_values):.2f}")
            print(f"   Median: {np.median(output_values):.2f}")
            print(f"   Std Dev: {np.std(output_values):.2f}")
            print(f"   Min: {np.min(output_values):.2f}")
            print(f"   Max: {np.max(output_values):.2f}")
            print(f"   25th Percentile: {np.percentile(output_values, 25):.2f}")
            print(f"   75th Percentile: {np.percentile(output_values, 75):.2f}")
            
            # Distribution
            hist, bins = np.histogram(output_values, bins=10)
            print(f"\n   Value Distribution:")
            for j in range(len(hist)):
                bar = '█' * int(hist[j] / max(hist) * 40)
                print(f"   {bins[j]:7.1f} - {bins[j+1]:7.1f}: {hist[j]:4d} {bar}")
    
    print("\n" + "="*80)
    print("2. PREDICTION STABILITY ANALYSIS")
    print("="*80)
    
    # Test on random subsamples
    sample_sizes = [100, 500, 1000]
    stability_results = []
    
    for sample_size in sample_sizes:
        if sample_size <= len(X):
            sample_predictions = []
            for _ in range(10):  # 10 random samples
                indices = np.random.choice(len(X), sample_size, replace=False)
                sample_pred = model.predict(X.iloc[indices])
                sample_predictions.append(np.mean(sample_pred))
            
            stability_results.append({
                'sample_size': sample_size,
                'mean': np.mean(sample_predictions),
                'std': np.std(sample_predictions)
            })
    
    print("\n📈 Prediction Stability Across Different Sample Sizes:")
    print(f"{'Sample Size':<15} {'Mean Prediction':<20} {'Std Deviation':<15} {'Stability':<15}")
    print("-" * 65)
    
    for result in stability_results:
        stability_pct = (1 - result['std'] / result['mean']) * 100 if result['mean'] != 0 else 0
        print(f"{result['sample_size']:<15} {result['mean']:<20.2f} {result['std']:<15.2f} {stability_pct:<15.1f}%")
    
    print("\n" + "="*80)
    print("3. ZONE-WISE PREDICTION ANALYSIS")
    print("="*80)
    
    zones = df_renamed['zone_id'].unique()
    print(f"\n📍 Analyzing predictions across {len(zones)} zones:")
    
    zone_stats = []
    for zone in sorted(zones):
        zone_mask = df_renamed['zone_id'] == zone
        zone_X = X[zone_mask]
        
        if len(zone_X) > 0:
            zone_pred = model.predict(zone_X)
            zone_mean = np.mean(zone_pred)
            zone_std = np.std(zone_pred)
            
            zone_stats.append({
                'zone': zone,
                'samples': len(zone_X),
                'mean': zone_mean,
                'std': zone_std
            })
    
    print(f"\n{'Zone':<8} {'Samples':<10} {'Mean Prediction':<20} {'Std Dev':<15}")
    print("-" * 53)
    
    for stat in zone_stats:
        print(f"{stat['zone']:<8} {stat['samples']:<10} {stat['mean']:<20.2f} {stat['std']:<15.2f}")
    
    print("\n" + "="*80)
    print("4. FEATURE SENSITIVITY ANALYSIS")
    print("="*80)
    
    # Test how predictions change with feature variations
    base_sample = X.iloc[0:1].copy()
    base_prediction = model.predict(base_sample)[0]
    
    print(f"\n🔬 Testing feature sensitivity (baseline prediction: {base_prediction})")
    print(f"\nFeature Impact Analysis (±20% change):")
    print(f"{'Feature':<25} {'Impact on Prediction':<20} {'Sensitivity':<15}")
    print("-" * 60)
    
    important_features = ['soil_moisture_pct', 'N_mgkg', 'P_mgkg', 'K_mgkg', 'air_temp_c', 'humidity_pct']
    
    for feature in important_features:
        if feature in X.columns:
            # Increase by 20%
            modified_sample = base_sample.copy()
            original_value = modified_sample[feature].values[0]
            modified_sample[feature] = original_value * 1.2
            
            new_prediction = model.predict(modified_sample)[0]
            
            if isinstance(new_prediction, np.ndarray):
                impact = np.mean(new_prediction) - np.mean(base_prediction)
            else:
                impact = new_prediction - base_prediction
            
            sensitivity = abs(impact / original_value) if original_value != 0 else 0
            
            impact_str = f"{impact:+.2f}"
            sensitivity_level = "High" if sensitivity > 5 else "Medium" if sensitivity > 1 else "Low"
            
            print(f"{feature:<25} {impact_str:<20} {sensitivity_level:<15}")
    
    print("\n" + "="*80)
    print("5. CONFIDENCE INTERVALS")
    print("="*80)
    
    # Calculate confidence intervals for predictions
    all_predictions_flat = predictions.flatten()
    
    print(f"\n📊 95% Confidence Interval for Predictions:")
    ci_lower = np.percentile(all_predictions_flat, 2.5)
    ci_upper = np.percentile(all_predictions_flat, 97.5)
    
    print(f"   Lower Bound (2.5%): {ci_lower:.2f}")
    print(f"   Upper Bound (97.5%): {ci_upper:.2f}")
    print(f"   Range: {ci_upper - ci_lower:.2f}")
    
    print(f"\n📊 90% Confidence Interval:")
    ci_lower_90 = np.percentile(all_predictions_flat, 5)
    ci_upper_90 = np.percentile(all_predictions_flat, 95)
    print(f"   Lower Bound (5%): {ci_lower_90:.2f}")
    print(f"   Upper Bound (95%): {ci_upper_90:.2f}")
    print(f"   Range: {ci_upper_90 - ci_lower_90:.2f}")
    
    print("\n" + "="*80)
    print("6. MODEL RELIABILITY SCORE")
    print("="*80)
    
    # Calculate reliability score based on various factors
    reliability_factors = []
    
    # Factor 1: Prediction consistency (low variance)
    pred_variance = np.var(all_predictions_flat)
    variance_score = max(0, 100 - (pred_variance / 100))
    reliability_factors.append(('Prediction Consistency', variance_score))
    
    # Factor 2: Feature coverage
    feature_coverage = len([c for c in feature_cols if c in X.columns]) / len(feature_cols) * 100
    reliability_factors.append(('Feature Coverage', feature_coverage))
    
    # Factor 3: Sample size adequacy
    sample_adequacy = min(100, len(X) / 100)
    reliability_factors.append(('Sample Size Adequacy', sample_adequacy))
    
    print(f"\n{'Reliability Factor':<30} {'Score':<10} {'Visual':<20}")
    print("-" * 60)
    
    for factor, score in reliability_factors:
        bar = '█' * int(score / 5)
        print(f"{factor:<30} {score:>6.1f}%   {bar}")
    
    overall_reliability = np.mean([score for _, score in reliability_factors])
    
    print(f"\n{'='*60}")
    print(f"{'OVERALL MODEL RELIABILITY SCORE:':<30} {overall_reliability:>6.1f}%")
    print(f"{'='*60}")
    
    if overall_reliability >= 85:
        print("\n✅ EXCELLENT - Model is highly reliable for production use")
    elif overall_reliability >= 70:
        print("\n✓ GOOD - Model is suitable for production with monitoring")
    elif overall_reliability >= 55:
        print("\n⚠️  FAIR - Model needs improvement before production")
    else:
        print("\n❌ POOR - Model requires retraining with better data")
    
    print("\n" + "="*80)
    print("7. RECOMMENDATIONS")
    print("="*80)
    
    print("\n📋 Based on this analysis:")
    
    if overall_reliability < 70:
        print("   • Collect more training data to improve model accuracy")
        print("   • Review feature engineering and selection")
        print("   • Consider ensemble methods for better predictions")
    
    if pred_variance > 10000:
        print("   • High prediction variance detected - consider normalization")
    
    if feature_coverage < 100:
        print(f"   • {100-feature_coverage:.0f}% of features are missing - ensure data completeness")
    
    print("   • Monitor model performance regularly")
    print("   • Implement prediction logging for continuous improvement")
    print("   • Consider A/B testing before full deployment")
    
    print("\n" + "="*80)
    print("REPORT COMPLETED")
    print("="*80)
    print(f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total Samples Analyzed: {len(X):,}")
    print(f"Model File: {model_path}")
    print("\n")

if __name__ == "__main__":
    try:
        generate_comprehensive_report()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        traceback.print_exc()
