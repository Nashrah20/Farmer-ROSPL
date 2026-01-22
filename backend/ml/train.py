import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.multioutput import MultiOutputRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.impute import SimpleImputer
from datetime import datetime

def prepare_training_data(mongo_data):
    """
    Prepare training data by joining sensors, weather, and actions
    """
    sensors_df = pd.DataFrame(mongo_data['sensors'])
    weather_df = pd.DataFrame(mongo_data['weather'])
    actions_df = pd.DataFrame(mongo_data['actions'])
    
    # Check if we have data
    if sensors_df.empty:
        raise ValueError("No sensor data available for training")
    if weather_df.empty:
        raise ValueError("No weather data available for training")
    if actions_df.empty:
        raise ValueError("No action data available for training")
    
    print(f"Loaded data: {len(sensors_df)} sensors, {len(weather_df)} weather, {len(actions_df)} actions")
    
    # Convert timestamps to datetime (they come as datetime from MongoDB already)
    sensors_df['timestamp'] = pd.to_datetime(sensors_df['timestamp'])
    weather_df['timestamp'] = pd.to_datetime(weather_df['timestamp'])
    actions_df['timestamp'] = pd.to_datetime(actions_df['timestamp'])
    
    # Merge sensor and weather data on zone_id and timestamp
    # Use approximate timestamp matching (within same hour)
    sensors_df['hour'] = sensors_df['timestamp'].dt.floor('H')
    weather_df['hour'] = weather_df['timestamp'].dt.floor('H')
    actions_df['hour'] = actions_df['timestamp'].dt.floor('H')
    
    # Merge sensor + weather
    merged = pd.merge(
        sensors_df,
        weather_df,
        on=['zone_id', 'hour'],
        how='inner',
        suffixes=('_sensor', '_weather')
    )
    
    # Merge with actions
    merged = pd.merge(
        merged,
        actions_df,
        on=['zone_id', 'hour'],
        how='inner',
        suffixes=('', '_action')
    )
    
    print(f"Total merged records: {len(merged)}")
    
    # Define feature columns
    feature_columns = [
        'soil_moisture_pct',
        'N_mgkg',
        'P_mgkg',
        'K_mgkg',
        'ph',
        'EC_ds_m',
        'NDVI',
        'leaf_health_score',
        'stress_level',
        'air_temp_c',
        'humidity_pct',
        'wind_kmph',
        'rainfall_mm'
    ]
    
    # Define target columns
    target_columns = [
        'irrigation_liters',
        'fertilizer_N_g',
        'fertilizer_P_g',
        'fertilizer_K_g'
    ]
    
    # Extract features
    X = merged[feature_columns].copy()
    
    # Extract targets
    y = merged[target_columns].copy()
    
    # Handle missing values in features
    imputer = SimpleImputer(strategy='mean')
    X_imputed = pd.DataFrame(
        imputer.fit_transform(X),
        columns=feature_columns
    )
    
    # Handle missing values in targets
    target_imputer = SimpleImputer(strategy='mean')
    y_imputed = pd.DataFrame(
        target_imputer.fit_transform(y),
        columns=target_columns
    )
    
    print(f"Feature shape: {X_imputed.shape}")
    print(f"Target shape: {y_imputed.shape}")
    
    return X_imputed, y_imputed, feature_columns, target_columns

def evaluate_model(model, X_test, y_test, model_name):
    """Evaluate model and return metrics"""
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    # Per-output metrics
    per_output_metrics = {}
    for i, col in enumerate(y_test.columns):
        per_output_metrics[col] = {
            'MAE': mean_absolute_error(y_test.iloc[:, i], y_pred[:, i]),
            'RMSE': np.sqrt(mean_squared_error(y_test.iloc[:, i], y_pred[:, i])),
            'R2': r2_score(y_test.iloc[:, i], y_pred[:, i])
        }
    
    return {
        'model_name': model_name,
        'overall_mae': mae,
        'overall_rmse': rmse,
        'overall_r2': r2,
        'per_output': per_output_metrics
    }

def train_models(mongo_data, model_save_path, features_save_path):
    """
    Train and compare multiple ML algorithms
    """
    print("=" * 60)
    print("FARM AI - ML MODEL TRAINING")
    print("=" * 60)
    
    # Prepare data
    print("\n[1] Preparing training data...")
    X, y, feature_columns, target_columns = prepare_training_data(mongo_data)
    
    # Split data
    print("\n[2] Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    
    # Define models to compare
    models = {
        'RandomForest': MultiOutputRegressor(
            RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        ),
        'HistGradientBoosting': MultiOutputRegressor(
            HistGradientBoostingRegressor(
                max_iter=100,
                max_depth=10,
                learning_rate=0.1,
                random_state=42
            )
        ),
        'Ridge': MultiOutputRegressor(
            Ridge(alpha=1.0, random_state=42)
        )
    }
    
    # Train and evaluate each model
    print("\n[3] Training and evaluating models...")
    results = []
    trained_models = {}
    
    for model_name, model in models.items():
        print(f"\n   Training {model_name}...")
        model.fit(X_train, y_train)
        
        print(f"   Evaluating {model_name}...")
        metrics = evaluate_model(model, X_test, y_test, model_name)
        results.append(metrics)
        trained_models[model_name] = model
        
        print(f"   ✓ {model_name} - MAE: {metrics['overall_mae']:.2f}, RMSE: {metrics['overall_rmse']:.2f}, R²: {metrics['overall_r2']:.3f}")
    
    # Print comparison table
    print("\n" + "=" * 60)
    print("MODEL COMPARISON TABLE")
    print("=" * 60)
    print(f"{'Model':<25} {'MAE':<12} {'RMSE':<12} {'R²':<10}")
    print("-" * 60)
    
    for result in results:
        print(f"{result['model_name']:<25} {result['overall_mae']:<12.2f} {result['overall_rmse']:<12.2f} {result['overall_r2']:<10.3f}")
    
    # Per-output metrics
    print("\n" + "=" * 60)
    print("PER-OUTPUT METRICS (Best Model)")
    print("=" * 60)
    
    # Select best model (lowest MAE)
    best_result = min(results, key=lambda x: x['overall_mae'])
    best_model_name = best_result['model_name']
    best_model = trained_models[best_model_name]
    
    print(f"\nBest Model: {best_model_name}")
    print(f"{'Output':<25} {'MAE':<12} {'RMSE':<12} {'R²':<10}")
    print("-" * 60)
    
    for output, metrics in best_result['per_output'].items():
        print(f"{output:<25} {metrics['MAE']:<12.2f} {metrics['RMSE']:<12.2f} {metrics['R2']:<10.3f}")
    
    # Save best model
    print(f"\n[4] Saving best model ({best_model_name})...")
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    joblib.dump(best_model, model_save_path)
    print(f"   ✓ Model saved to: {model_save_path}")
    
    # Save feature columns order
    print(f"\n[5] Saving feature configuration...")
    feature_config = {
        'feature_columns': feature_columns,
        'target_columns': target_columns,
        'model_name': best_model_name,
        'trained_at': datetime.now().isoformat(),
        'metrics': {
            'mae': best_result['overall_mae'],
            'rmse': best_result['overall_rmse'],
            'r2': best_result['overall_r2']
        }
    }
    
    with open(features_save_path, 'w') as f:
        json.dump(feature_config, f, indent=2)
    print(f"   ✓ Features saved to: {features_save_path}")
    
    print("\n" + "=" * 60)
    print("TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    
    return {
        'best_model_name': best_model_name,
        'metrics': best_result,
        'all_results': results
    }
