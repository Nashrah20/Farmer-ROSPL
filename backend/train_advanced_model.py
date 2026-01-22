"""
Advanced ML Model Training with Reward-Based Learning
Uses all 43,200 readings with positive/negative reward system
"""

import sys
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import Config
from utils.mongo import MongoDBClient

class RewardBasedModelTrainer:
    """Train ML model with reward-based learning for farm optimization"""
    
    def __init__(self):
        self.mongo_client = MongoDBClient()
        self.db = self.mongo_client.client[Config.MONGODB_DATABASE]
        self.scaler = StandardScaler()
        
    def calculate_rewards(self, sensor_data, actions, weather_data):
        """
        Calculate reward scores for each action based on outcomes
        Positive rewards: Good crop health, optimal moisture, efficient resource use
        Negative rewards: Stress, over/under watering, resource waste
        """
        rewards = []
        
        for i in range(len(sensor_data)):
            reward = 0
            sensor = sensor_data.iloc[i]
            
            # Positive Rewards
            # 1. Optimal soil moisture (30-60%)
            if 30 <= sensor.get('soil_moisture', 0) <= 60:
                reward += 10
            elif 20 <= sensor.get('soil_moisture', 0) <= 70:
                reward += 5
            else:
                reward -= 5  # Negative for poor moisture
            
            # 2. Good leaf health (>70)
            leaf_health = sensor.get('leaf_health', 0)
            if leaf_health > 80:
                reward += 15
            elif leaf_health > 60:
                reward += 8
            elif leaf_health < 40:
                reward -= 10  # Negative for poor health
            
            # 3. Low stress level (0-2)
            stress = sensor.get('stress_level', 0)
            if stress <= 1:
                reward += 10
            elif stress <= 2:
                reward += 5
            elif stress > 3:
                reward -= 8  # Negative for high stress
            
            # 4. Optimal NDVI (0.6-0.9)
            ndvi = sensor.get('ndvi', 0)
            if 0.6 <= ndvi <= 0.9:
                reward += 10
            elif ndvi < 0.3:
                reward -= 5
            
            # 5. Balanced NPK levels
            n = sensor.get('nitrogen', 0)
            p = sensor.get('phosphorus', 0)
            k = sensor.get('potassium', 0)
            
            npk_balanced = (50 <= n <= 200) and (30 <= p <= 100) and (100 <= k <= 300)
            if npk_balanced:
                reward += 12
            elif n < 20 or p < 10 or k < 50:
                reward -= 8  # Negative for nutrient deficiency
            
            # 6. Optimal pH (6.0-7.5)
            ph = sensor.get('ph', 0)
            if 6.0 <= ph <= 7.5:
                reward += 8
            elif ph < 5.5 or ph > 8.0:
                reward -= 5
            
            # 7. Good temperature range
            temp = sensor.get('temperature', 0)
            if 20 <= temp <= 30:
                reward += 5
            elif temp > 35 or temp < 10:
                reward -= 5
            
            # 8. Appropriate humidity
            humidity = sensor.get('humidity', 0)
            if 40 <= humidity <= 70:
                reward += 5
            elif humidity > 90 or humidity < 20:
                reward -= 3
            
            # Negative Rewards for Resource Waste
            # Check if action was efficient based on current state
            if i < len(actions):
                action = actions.iloc[i]
                
                # Over-irrigation penalty
                if sensor.get('soil_moisture', 0) > 70 and action.get('irrigation_amount', 0) > 0:
                    reward -= 10
                
                # Over-fertilization penalty
                if n > 150 and action.get('fertilizer_amount', 0) > 100:
                    reward -= 8
                
                # Efficient resource use bonus
                if 40 <= sensor.get('soil_moisture', 0) <= 50 and 0 < action.get('irrigation_amount', 0) < 50:
                    reward += 5
            
            rewards.append(reward)
        
        return np.array(rewards)
    
    def load_all_data(self):
        """Load all 43,200 readings from MongoDB"""
        print("\n[1/7] Loading all data from MongoDB...")
        
        sensors = list(self.db.sensorReadings.find())
        weather = list(self.db.weather.find())
        actions = list(self.db.actions.find())
        
        print(f"   ✓ Loaded {len(sensors):,} sensor readings")
        print(f"   ✓ Loaded {len(weather):,} weather records")
        print(f"   ✓ Loaded {len(actions):,} action records")
        
        return sensors, weather, actions
    
    def prepare_dataset(self, sensors, weather, actions):
        """Prepare and merge datasets with reward calculation"""
        print("\n[2/7] Preparing dataset with reward calculations...")
        
        df_sensors = pd.DataFrame(sensors)
        df_weather = pd.DataFrame(weather)
        df_actions = pd.DataFrame(actions)
        
        # Merge all data
        df = df_sensors.merge(df_weather, on=['zone_id', 'timestamp'], how='left', suffixes=('', '_weather'))
        df = df.merge(df_actions, on=['zone_id', 'timestamp'], how='left', suffixes=('', '_action'))
        
        print(f"   ✓ Merged dataset: {len(df):,} rows")
        
        # Calculate rewards
        print("   ⚙ Calculating reward scores...")
        rewards = self.calculate_rewards(df, df_actions, df_weather)
        df['reward_score'] = rewards
        
        reward_stats = {
            'mean': np.mean(rewards),
            'median': np.median(rewards),
            'positive': np.sum(rewards > 0),
            'negative': np.sum(rewards < 0),
            'neutral': np.sum(rewards == 0)
        }
        
        print(f"   ✓ Reward Statistics:")
        print(f"     Mean: {reward_stats['mean']:.2f}")
        print(f"     Median: {reward_stats['median']:.2f}")
        print(f"     Positive: {reward_stats['positive']:,} ({reward_stats['positive']/len(rewards)*100:.1f}%)")
        print(f"     Negative: {reward_stats['negative']:,} ({reward_stats['negative']/len(rewards)*100:.1f}%)")
        
        return df, reward_stats
    
    def engineer_features(self, df):
        """Create advanced features"""
        print("\n[3/7] Engineering features...")
        
        # Basic features
        feature_cols = [
            'soil_moisture', 'temperature', 'humidity', 'rainfall',
            'nitrogen', 'phosphorus', 'potassium', 'ph', 'ec',
            'ndvi', 'leaf_health', 'stress_level', 'wind_speed'
        ]
        
        # Add interaction features
        df['npk_ratio'] = df['nitrogen'] / (df['phosphorus'] + 1)
        df['moisture_temp_index'] = df['soil_moisture'] * df['temperature'] / 100
        df['health_stress_ratio'] = df['leaf_health'] / (df['stress_level'] + 1)
        
        # Add time-based features
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['month'] = df['timestamp'].dt.month
        
        # Seasonal features
        df['is_summer'] = df['month'].isin([4, 5, 6]).astype(int)
        df['is_monsoon'] = df['month'].isin([7, 8, 9]).astype(int)
        
        advanced_features = feature_cols + [
            'npk_ratio', 'moisture_temp_index', 'health_stress_ratio',
            'hour', 'day_of_week', 'month', 'is_summer', 'is_monsoon'
        ]
        
        # Fill missing values
        for col in advanced_features:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median())
            else:
                df[col] = 0
        
        print(f"   ✓ Created {len(advanced_features)} features")
        
        return df, advanced_features
    
    def train_models(self, X_train, y_train, X_test, y_test, reward_weights):
        """Train multiple models with reward-weighted samples"""
        print("\n[4/7] Training reward-weighted ML models...")
        
        models = {
            'RandomForest': RandomForestRegressor(
                n_estimators=200,
                max_depth=15,
                min_samples_split=10,
                min_samples_leaf=4,
                random_state=42,
                n_jobs=-1
            ),
            'GradientBoosting': GradientBoostingRegressor(
                n_estimators=150,
                max_depth=8,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42
            )
        }
        
        results = {}
        
        for name, model in models.items():
            print(f"\n   Training {name}...")
            
            # Train with sample weights (higher weight for positive rewards)
            model.fit(X_train, y_train, sample_weight=reward_weights)
            
            # Predictions
            y_pred_train = model.predict(X_train)
            y_pred_test = model.predict(X_test)
            
            # Metrics
            train_mae = mean_absolute_error(y_train, y_pred_train)
            test_mae = mean_absolute_error(y_test, y_pred_test)
            train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
            test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
            train_r2 = r2_score(y_train, y_pred_train)
            test_r2 = r2_score(y_test, y_pred_test)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, 
                                       scoring='r2', n_jobs=-1)
            
            results[name] = {
                'model': model,
                'train_mae': train_mae,
                'test_mae': test_mae,
                'train_rmse': train_rmse,
                'test_rmse': test_rmse,
                'train_r2': train_r2,
                'test_r2': test_r2,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std()
            }
            
            print(f"     Train MAE: {train_mae:.4f} | Test MAE: {test_mae:.4f}")
            print(f"     Train RMSE: {train_rmse:.4f} | Test RMSE: {test_rmse:.4f}")
            print(f"     Train R²: {train_r2:.4f} | Test R²: {test_r2:.4f}")
            print(f"     CV R² Score: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        return results
    
    def select_best_model(self, results):
        """Select best model based on multiple criteria"""
        print("\n[5/7] Selecting best model...")
        
        best_model_name = None
        best_score = -np.inf
        
        for name, metrics in results.items():
            # Composite score: CV score + Test R² - overfitting penalty
            overfit_penalty = abs(metrics['train_r2'] - metrics['test_r2']) * 0.5
            composite_score = metrics['cv_mean'] + metrics['test_r2'] - overfit_penalty
            
            print(f"   {name}: Composite Score = {composite_score:.4f}")
            
            if composite_score > best_score:
                best_score = composite_score
                best_model_name = name
        
        print(f"\n   ✓ Best Model: {best_model_name} (Score: {best_score:.4f})")
        
        return best_model_name, results[best_model_name]
    
    def save_model(self, model, feature_cols, metrics, reward_stats):
        """Save model and metadata"""
        print("\n[6/7] Saving model and configuration...")
        
        # Save model
        model_path = Config.ML_MODEL_PATH
        joblib.dump(model, model_path)
        print(f"   ✓ Model saved: {model_path}")
        
        # Save features
        features_path = Config.ML_FEATURES_PATH
        feature_config = {
            'feature_columns': feature_cols,
            'n_features': len(feature_cols),
            'trained_at': datetime.now().isoformat(),
            'training_samples': metrics.get('n_samples', 0),
            'model_type': type(model).__name__,
            'metrics': {
                'train_mae': float(metrics['train_mae']),
                'test_mae': float(metrics['test_mae']),
                'train_r2': float(metrics['train_r2']),
                'test_r2': float(metrics['test_r2']),
                'cv_mean': float(metrics['cv_mean']),
                'cv_std': float(metrics['cv_std'])
            },
            'reward_system': {
                'enabled': True,
                'mean_reward': float(reward_stats['mean']),
                'positive_ratio': float(reward_stats['positive'] / (reward_stats['positive'] + reward_stats['negative']))
            }
        }
        
        with open(features_path, 'w') as f:
            json.dump(feature_config, f, indent=2)
        
        print(f"   ✓ Features saved: {features_path}")
        
        return feature_config
    
    def print_summary(self, metrics, feature_config):
        """Print training summary"""
        print("\n[7/7] Training Summary")
        print("="*80)
        
        print(f"\n✅ MODEL TRAINING COMPLETED SUCCESSFULLY")
        print(f"\n📊 Performance Metrics:")
        print(f"   Test R² Score: {metrics['test_r2']:.4f}")
        print(f"   Test MAE: {metrics['test_mae']:.4f}")
        print(f"   Test RMSE: {metrics['test_rmse']:.4f}")
        print(f"   Cross-Validation R²: {metrics['cv_mean']:.4f} ± {metrics['cv_std']:.4f}")
        
        # Model quality assessment
        if metrics['test_r2'] > 0.85:
            quality = "EXCELLENT ⭐⭐⭐⭐⭐"
        elif metrics['test_r2'] > 0.75:
            quality = "VERY GOOD ⭐⭐⭐⭐"
        elif metrics['test_r2'] > 0.65:
            quality = "GOOD ⭐⭐⭐"
        else:
            quality = "FAIR ⭐⭐"
        
        print(f"\n🎯 Model Quality: {quality}")
        
        print(f"\n🔧 Model Configuration:")
        print(f"   Model Type: {feature_config['model_type']}")
        print(f"   Features: {feature_config['n_features']}")
        print(f"   Training Samples: {feature_config['training_samples']:,}")
        print(f"   Reward System: Enabled ✓")
        
        print(f"\n💡 Reward System Stats:")
        print(f"   Mean Reward: {feature_config['reward_system']['mean_reward']:.2f}")
        print(f"   Positive Ratio: {feature_config['reward_system']['positive_ratio']:.2%}")
        
        print("\n" + "="*80)
        print(f"Training completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)

def main():
    """Main training function"""
    print("\n" + "="*80)
    print("ADVANCED ML MODEL TRAINING WITH REWARD-BASED LEARNING")
    print("="*80)
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    trainer = RewardBasedModelTrainer()
    
    try:
        # Load data
        sensors, weather, actions = trainer.load_all_data()
        
        # Prepare dataset with rewards
        df, reward_stats = trainer.prepare_dataset(sensors, weather, actions)
        
        # Engineer features
        df, feature_cols = trainer.engineer_features(df)
        
        # Prepare training data
        X = df[feature_cols]
        
        # Target: Use irrigation_liters as target variable
        if 'irrigation_liters' in df.columns:
            y = df['irrigation_liters'].fillna(df['irrigation_liters'].median())
        elif 'irrigation_amount' in df.columns:
            y = df['irrigation_amount'].fillna(df['irrigation_amount'].median())
        else:
            # Create composite target from NPK fertilizers
            y = (df['fertilizer_N_g'].fillna(0) + 
                 df['fertilizer_P_g'].fillna(0) + 
                 df['fertilizer_K_g'].fillna(0)) / 3
        
        # Sample weights based on rewards (positive rewards get higher weight)
        reward_weights = np.maximum(df['reward_score'], 1)  # Minimum weight of 1
        reward_weights = reward_weights / reward_weights.sum() * len(reward_weights)
        
        # Split data
        X_train, X_test, y_train, y_test, w_train, w_test = train_test_split(
            X, y, reward_weights, test_size=0.2, random_state=42
        )
        
        print(f"\n   Training set: {len(X_train):,} samples")
        print(f"   Test set: {len(X_test):,} samples")
        
        # Train models
        results = trainer.train_models(X_train, y_train, X_test, y_test, w_train)
        
        # Select best model
        best_name, best_metrics = trainer.select_best_model(results)
        best_model = best_metrics['model']
        
        # Add sample count to metrics
        best_metrics['n_samples'] = len(X_train)
        
        # Save model
        feature_config = trainer.save_model(best_model, feature_cols, best_metrics, reward_stats)
        
        # Print summary
        trainer.print_summary(best_metrics, feature_config)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
