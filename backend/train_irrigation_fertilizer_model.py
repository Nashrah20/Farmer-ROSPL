"""
Train Irrigation and Fertilizer Prediction Models

This script trains machine learning models to predict:
1. Irrigation amount (liters)
2. Fertilizer NPK amounts (N, P, K in grams)

Based on current sensor readings, weather conditions, crop, and soil type.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pickle
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Try to import XGBoost, fall back if not available
try:
    from xgboost import XGBRegressor
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("⚠️  XGBoost not available, will use only RandomForest and GradientBoosting")


def load_and_merge_data():
    """Load sensor, weather, and action data and merge them"""
    print("📂 Loading datasets...")
    
    # Load datasets
    sensor_df = pd.read_csv('Data/maharashtra_rabi_sensor_readings_15crops_20251101_20260301_hourly(1).csv')
    weather_df = pd.read_csv('Data/maharashtra_rabi_weather_15crops_20251101_20260301_hourly.csv')
    actions_df = pd.read_csv('Data/maharashtra_rabi_actions_15crops_20251101_20260301_hourly.csv')
    
    print(f"   ✅ Sensor data: {len(sensor_df):,} rows")
    print(f"   ✅ Weather data: {len(weather_df):,} rows")
    print(f"   ✅ Actions data: {len(actions_df):,} rows")
    
    # Merge datasets on timestamp and zone_id
    merged_df = sensor_df.merge(
        actions_df[['timestamp', 'zone_id', 'irrigation_liters', 'fertilizer_N_g', 'fertilizer_P_g', 'fertilizer_K_g']], 
        on=['timestamp', 'zone_id'], 
        how='inner'
    )
    
    print(f"   ✅ Merged data: {len(merged_df):,} rows")
    
    return merged_df


def prepare_features(df):
    """Prepare features for training"""
    print("\n🔧 Preparing features...")
    
    # Select relevant features
    feature_columns = [
        'soil_moisture_pct', 'soil_temp_c', 'air_temp_c', 'humidity_pct',
        'wind_kmph', 'rainfall_mm', 'ph', 'EC_ds_m',
        'N_mgkg', 'P_mgkg', 'K_mgkg', 'NDVI', 'leaf_health_score', 'stress_level'
    ]
    
    # Categorical features to encode
    categorical_features = ['soil_type', 'crop', 'crop_stage', 'region']
    
    # Create a copy for processing
    df_processed = df.copy()
    
    # Initialize label encoders
    label_encoders = {}
    encoded_columns = []
    
    # Encode categorical features
    for col in categorical_features:
        if col in df_processed.columns:
            le = LabelEncoder()
            df_processed[f'{col}_encoded'] = le.fit_transform(df_processed[col].astype(str))
            label_encoders[col] = le
            encoded_columns.append(f'{col}_encoded')
            print(f"   ✅ Encoded {col}: {len(le.classes_)} classes")
    
    # Combine all features
    all_features = feature_columns + encoded_columns
    
    # Target variables
    target_columns = ['irrigation_liters', 'fertilizer_N_g', 'fertilizer_P_g', 'fertilizer_K_g']
    
    # Extract features and targets
    X = df_processed[all_features]
    y_irrigation = df_processed['irrigation_liters']
    y_N = df_processed['fertilizer_N_g']
    y_P = df_processed['fertilizer_P_g']
    y_K = df_processed['fertilizer_K_g']
    
    print(f"\n   📊 Total features: {len(all_features)}")
    print(f"   📊 Feature columns: {all_features}")
    
    return X, y_irrigation, y_N, y_P, y_K, all_features, label_encoders


def train_model(X, y, model_name, target_name):
    """Train and evaluate a regression model"""
    print(f"\n🏋️  Training {model_name} for {target_name}...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train models
    models = {}
    scores = {}
    
    # Random Forest
    rf = RandomForestRegressor(n_estimators=100, max_depth=15, min_samples_split=10, 
                              random_state=42, n_jobs=-1)
    rf.fit(X_train_scaled, y_train)
    rf_pred = rf.predict(X_test_scaled)
    models['RandomForest'] = rf
    scores['RandomForest'] = {
        'MAE': mean_absolute_error(y_test, rf_pred),
        'RMSE': np.sqrt(mean_squared_error(y_test, rf_pred)),
        'R2': r2_score(y_test, rf_pred)
    }
    
    # Gradient Boosting
    gb = GradientBoostingRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, 
                                  random_state=42)
    gb.fit(X_train_scaled, y_train)
    gb_pred = gb.predict(X_test_scaled)
    models['GradientBoosting'] = gb
    scores['GradientBoosting'] = {
        'MAE': mean_absolute_error(y_test, gb_pred),
        'RMSE': np.sqrt(mean_squared_error(y_test, gb_pred)),
        'R2': r2_score(y_test, gb_pred)
    }
    
    # XGBoost (if available)
    if XGBOOST_AVAILABLE:
        xgb = XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, 
                          random_state=42, n_jobs=-1)
        xgb.fit(X_train_scaled, y_train)
        xgb_pred = xgb.predict(X_test_scaled)
        models['XGBoost'] = xgb
        scores['XGBoost'] = {
            'MAE': mean_absolute_error(y_test, xgb_pred),
            'RMSE': np.sqrt(mean_squared_error(y_test, xgb_pred)),
            'R2': r2_score(y_test, xgb_pred)
        }
    
    # Print results
    print(f"\n   📊 {target_name} Model Performance:")
    for model_type, metrics in scores.items():
        print(f"   {model_type}:")
        print(f"      MAE: {metrics['MAE']:.4f}")
        print(f"      RMSE: {metrics['RMSE']:.4f}")
        print(f"      R²: {metrics['R2']:.4f}")
    
    # Select best model based on MAE
    best_model_name = min(scores, key=lambda x: scores[x]['MAE'])
    best_model = models[best_model_name]
    best_score = scores[best_model_name]
    
    print(f"\n   🏆 Best Model: {best_model_name}")
    print(f"      MAE: {best_score['MAE']:.4f}")
    print(f"      R²: {best_score['R2']:.4f}")
    
    return best_model, scaler, best_model_name, best_score


def get_feature_importance(model, feature_names, model_name, target_name):
    """Get and display feature importance"""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        feature_importance = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        print(f"\n   📈 Top 10 Features for {target_name} ({model_name}):")
        for idx, row in feature_importance.head(10).iterrows():
            print(f"      {row['feature']}: {row['importance']:.4f}")
        
        return feature_importance.to_dict('records')
    return None


def main():
    """Main training pipeline"""
    print("="*70)
    print("🌾 IRRIGATION & FERTILIZER PREDICTION MODEL TRAINING")
    print("="*70)
    
    start_time = datetime.now()
    
    # Load and merge data
    df = load_and_merge_data()
    
    # Prepare features
    X, y_irrigation, y_N, y_P, y_K, feature_columns, label_encoders = prepare_features(df)
    
    print(f"\n📊 Dataset Summary:")
    print(f"   Total samples: {len(X):,}")
    print(f"   Features: {len(feature_columns)}")
    print(f"   Irrigation range: {y_irrigation.min():.1f} - {y_irrigation.max():.1f} liters")
    print(f"   Nitrogen range: {y_N.min():.1f} - {y_N.max():.1f} g")
    print(f"   Phosphorus range: {y_P.min():.1f} - {y_P.max():.1f} g")
    print(f"   Potassium range: {y_K.min():.1f} - {y_K.max():.1f} g")
    
    # Train models
    print("\n" + "="*70)
    print("🚀 TRAINING MODELS")
    print("="*70)
    
    models_info = {}
    
    # Train irrigation model
    irrigation_model, irrigation_scaler, irrigation_model_name, irrigation_score = train_model(
        X, y_irrigation, "Irrigation Model", "Irrigation (liters)"
    )
    irrigation_importance = get_feature_importance(irrigation_model, feature_columns, 
                                                  irrigation_model_name, "Irrigation")
    models_info['irrigation'] = {
        'model_name': irrigation_model_name,
        'score': irrigation_score,
        'importance': irrigation_importance
    }
    
    # Train nitrogen model
    N_model, N_scaler, N_model_name, N_score = train_model(
        X, y_N, "Nitrogen Model", "Nitrogen (g)"
    )
    N_importance = get_feature_importance(N_model, feature_columns, N_model_name, "Nitrogen")
    models_info['nitrogen'] = {
        'model_name': N_model_name,
        'score': N_score,
        'importance': N_importance
    }
    
    # Train phosphorus model
    P_model, P_scaler, P_model_name, P_score = train_model(
        X, y_P, "Phosphorus Model", "Phosphorus (g)"
    )
    P_importance = get_feature_importance(P_model, feature_columns, P_model_name, "Phosphorus")
    models_info['phosphorus'] = {
        'model_name': P_model_name,
        'score': P_score,
        'importance': P_importance
    }
    
    # Train potassium model
    K_model, K_scaler, K_model_name, K_score = train_model(
        X, y_K, "Potassium Model", "Potassium (g)"
    )
    K_importance = get_feature_importance(K_model, feature_columns, K_model_name, "Potassium")
    models_info['potassium'] = {
        'model_name': K_model_name,
        'score': K_score,
        'importance': K_importance
    }
    
    # Save models
    print("\n" + "="*70)
    print("💾 SAVING MODELS")
    print("="*70)
    
    # Save irrigation model
    with open('irrigation_model.pkl', 'wb') as f:
        pickle.dump(irrigation_model, f)
    print("   ✅ Saved irrigation_model.pkl")
    
    # Save fertilizer models
    with open('fertilizer_model.pkl', 'wb') as f:
        pickle.dump({
            'nitrogen': N_model,
            'phosphorus': P_model,
            'potassium': K_model
        }, f)
    print("   ✅ Saved fertilizer_model.pkl")
    
    # Save preprocessing artifacts
    preprocessing = {
        'irrigation_scaler': irrigation_scaler,
        'nitrogen_scaler': N_scaler,
        'phosphorus_scaler': P_scaler,
        'potassium_scaler': K_scaler,
        'feature_columns': feature_columns,
        'label_encoders': label_encoders,
        'models_info': models_info
    }
    
    with open('irrigation_fertilizer_preprocessing.pkl', 'wb') as f:
        pickle.dump(preprocessing, f)
    print("   ✅ Saved irrigation_fertilizer_preprocessing.pkl")
    
    # Save feature importance as JSON
    with open('irrigation_fertilizer_features.json', 'w') as f:
        json.dump(models_info, f, indent=2)
    print("   ✅ Saved irrigation_fertilizer_features.json")
    
    # Print final summary
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETE")
    print("="*70)
    print(f"⏱️  Training time: {duration:.2f} seconds")
    print(f"📊 Total samples: {len(X):,}")
    print(f"📁 Models saved:")
    print(f"   - irrigation_model.pkl")
    print(f"   - fertilizer_model.pkl")
    print(f"   - irrigation_fertilizer_preprocessing.pkl")
    print(f"   - irrigation_fertilizer_features.json")
    print("\n🎯 Model Performance Summary:")
    print(f"   Irrigation ({irrigation_model_name}): MAE={irrigation_score['MAE']:.4f}, R²={irrigation_score['R2']:.4f}")
    print(f"   Nitrogen ({N_model_name}): MAE={N_score['MAE']:.4f}, R²={N_score['R2']:.4f}")
    print(f"   Phosphorus ({P_model_name}): MAE={P_score['MAE']:.4f}, R²={P_score['R2']:.4f}")
    print(f"   Potassium ({K_model_name}): MAE={K_score['MAE']:.4f}, R²={K_score['R2']:.4f}")
    print("="*70)


if __name__ == "__main__":
    main()
