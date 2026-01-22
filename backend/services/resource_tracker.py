"""
Resource Usage Tracking Module
Track water, fertilizer, soil balance, and crop stress to reduce wastage and improve yield
"""
from datetime import datetime, timedelta
import numpy as np

class ResourceTracker:
    """
    Track and analyze resource usage for optimization
    Monitors water, fertilizer, and provides insights for waste reduction
    """
    
    def __init__(self, mongo_client):
        self.mongo_client = mongo_client
    
    def track_irrigation(self, zone_id, amount_liters, timestamp=None):
        """Track irrigation event"""
        if timestamp is None:
            timestamp = datetime.now()
        
        irrigation_record = {
            'zone_id': zone_id,
            'type': 'irrigation',
            'amount_liters': amount_liters,
            'timestamp': timestamp,
            'recorded_at': datetime.now().isoformat()
        }
        
        # Save to database
        self.mongo_client.db.resource_usage.insert_one(irrigation_record)
        
        return {
            'success': True,
            'message': f'Irrigation of {amount_liters}L tracked successfully'
        }
    
    def track_fertilizer(self, zone_id, N_g, P_g, K_g, timestamp=None):
        """Track fertilizer application"""
        if timestamp is None:
            timestamp = datetime.now()
        
        fertilizer_record = {
            'zone_id': zone_id,
            'type': 'fertilizer',
            'N_g': N_g,
            'P_g': P_g,
            'K_g': K_g,
            'total_g': N_g + P_g + K_g,
            'timestamp': timestamp,
            'recorded_at': datetime.now().isoformat()
        }
        
        # Save to database
        self.mongo_client.db.resource_usage.insert_one(fertilizer_record)
        
        return {
            'success': True,
            'message': f'Fertilizer application (N:{N_g}g, P:{P_g}g, K:{K_g}g) tracked successfully'
        }
    
    def get_usage_summary(self, zone_id, days=30):
        """Get resource usage summary for a zone"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Get all resource records
        records = list(self.mongo_client.db.resource_usage.find({
            'zone_id': zone_id,
            'timestamp': {'$gte': cutoff_date}
        }).sort('timestamp', -1))
        
        if not records:
            return {
                'zone_id': zone_id,
                'period_days': days,
                'message': 'No resource usage data available for this period'
            }
        
        # Separate by type
        irrigation_records = [r for r in records if r['type'] == 'irrigation']
        fertilizer_records = [r for r in records if r['type'] == 'fertilizer']
        
        # Calculate totals
        total_water = sum(r['amount_liters'] for r in irrigation_records)
        total_N = sum(r.get('N_g', 0) for r in fertilizer_records)
        total_P = sum(r.get('P_g', 0) for r in fertilizer_records)
        total_K = sum(r.get('K_g', 0) for r in fertilizer_records)
        
        # Calculate averages
        irrigation_events = len(irrigation_records)
        fertilizer_events = len(fertilizer_records)
        
        avg_irrigation = total_water / irrigation_events if irrigation_events > 0 else 0
        
        return {
            'zone_id': zone_id,
            'period_days': days,
            'water_usage': {
                'total_liters': total_water,
                'irrigation_events': irrigation_events,
                'average_per_event': avg_irrigation,
                'daily_average': total_water / days
            },
            'fertilizer_usage': {
                'total_N_g': total_N,
                'total_P_g': total_P,
                'total_K_g': total_K,
                'total_all_g': total_N + total_P + total_K,
                'application_events': fertilizer_events,
                'daily_average_g': (total_N + total_P + total_K) / days
            },
            'efficiency_score': self._calculate_efficiency_score(
                total_water, total_N, total_P, total_K, days, zone_id
            )
        }
    
    def _calculate_efficiency_score(self, water, N, P, K, days, zone_id):
        """Calculate resource efficiency score"""
        # Get latest sensor data to check outcomes
        latest_data = self.mongo_client.get_latest_data(zone_id)
        
        if not latest_data['sensor']:
            return {'score': 'N/A', 'message': 'Insufficient data'}
        
        sensor = latest_data['sensor']
        
        # Check soil moisture (water efficiency)
        moisture = sensor.get('soil_moisture_pct', 50)
        water_efficiency = 100 if 40 <= moisture <= 70 else max(50, 100 - abs(moisture - 55) * 2)
        
        # Check nutrient levels (fertilizer efficiency)
        N_level = sensor.get('N_mgkg', 200)
        P_level = sensor.get('P_mgkg', 20)
        K_level = sensor.get('K_mgkg', 150)
        
        N_efficiency = 100 if 180 <= N_level <= 250 else max(50, 100 - abs(N_level - 215) / 2)
        P_efficiency = 100 if 15 <= P_level <= 30 else max(50, 100 - abs(P_level - 22) * 2)
        K_efficiency = 100 if 140 <= K_level <= 200 else max(50, 100 - abs(K_level - 170) / 2)
        
        nutrient_efficiency = (N_efficiency + P_efficiency + K_efficiency) / 3
        
        # Overall efficiency
        overall_score = (water_efficiency * 0.5 + nutrient_efficiency * 0.5)
        
        return {
            'overall_score': round(overall_score, 1),
            'water_efficiency': round(water_efficiency, 1),
            'nutrient_efficiency': round(nutrient_efficiency, 1),
            'grade': 'EXCELLENT' if overall_score >= 85 else 'GOOD' if overall_score >= 70 else 'FAIR' if overall_score >= 50 else 'NEEDS_IMPROVEMENT'
        }
    
    def identify_wastage(self, zone_id, days=30):
        """Identify potential resource wastage"""
        summary = self.get_usage_summary(zone_id, days)
        
        if 'message' in summary:
            return {'wastage_detected': False, 'message': summary['message']}
        
        wastage_alerts = []
        
        # Get current conditions
        latest_data = self.mongo_client.get_latest_data(zone_id)
        if latest_data['sensor']:
            sensor = latest_data['sensor']
            
            # Check for over-irrigation
            moisture = sensor.get('soil_moisture_pct', 50)
            if moisture > 80:
                water_total = summary['water_usage']['total_liters']
                wastage_alerts.append({
                    'type': 'OVER_IRRIGATION',
                    'severity': 'HIGH',
                    'description': f'Soil moisture is {moisture}% - excessive irrigation detected',
                    'estimated_waste': f'{water_total * 0.3:.0f}L over {days} days',
                    'recommendation': 'Reduce irrigation frequency or amount by 30%'
                })
            
            # Check for over-fertilization
            N = sensor.get('N_mgkg', 0)
            P = sensor.get('P_mgkg', 0)
            K = sensor.get('K_mgkg', 0)
            
            if N > 300:
                wastage_alerts.append({
                    'type': 'NITROGEN_EXCESS',
                    'severity': 'MEDIUM',
                    'description': f'Nitrogen level is {N} mg/kg - above optimal range',
                    'recommendation': 'Reduce nitrogen fertilizer application by 40%'
                })
            
            if P > 40:
                wastage_alerts.append({
                    'type': 'PHOSPHORUS_EXCESS',
                    'severity': 'MEDIUM',
                    'description': f'Phosphorus level is {P} mg/kg - above optimal range',
                    'recommendation': 'Skip phosphorus application for next 2-3 cycles'
                })
            
            if K > 250:
                wastage_alerts.append({
                    'type': 'POTASSIUM_EXCESS',
                    'severity': 'MEDIUM',
                    'description': f'Potassium level is {K} mg/kg - above optimal range',
                    'recommendation': 'Reduce potassium fertilizer by 50%'
                })
        
        # Check for inefficient application timing
        if summary['water_usage']['irrigation_events'] > days * 1.5:
            wastage_alerts.append({
                'type': 'FREQUENT_IRRIGATION',
                'severity': 'LOW',
                'description': f'{summary["water_usage"]["irrigation_events"]} irrigation events in {days} days',
                'recommendation': 'Consolidate into fewer, deeper irrigation sessions'
            })
        
        return {
            'wastage_detected': len(wastage_alerts) > 0,
            'alerts': wastage_alerts,
            'potential_savings': self._calculate_potential_savings(wastage_alerts, summary),
            'optimization_score': 100 - (len(wastage_alerts) * 15)
        }
    
    def _calculate_potential_savings(self, alerts, summary):
        """Calculate potential resource savings"""
        water_savings = 0
        fertilizer_savings = 0
        
        for alert in alerts:
            if alert['type'] == 'OVER_IRRIGATION':
                water_savings += summary['water_usage']['total_liters'] * 0.3
            elif 'EXCESS' in alert['type']:
                fertilizer_savings += 100  # Estimated grams
        
        return {
            'water_liters': round(water_savings, 0),
            'fertilizer_g': round(fertilizer_savings, 0),
            'estimated_cost_savings': f'₹{(water_savings * 0.1 + fertilizer_savings * 0.5):.0f}'
        }
    
    def get_soil_balance_trend(self, zone_id, days=30):
        """Track soil nutrient balance over time"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Get historical sensor data
        history = self.mongo_client.db.sensor_readings.find({
            'zone_id': zone_id,
            'timestamp': {'$gte': cutoff_date}
        }).sort('timestamp', 1)
        
        history_list = list(history)
        
        if not history_list:
            return {'message': 'No historical data available'}
        
        # Extract NPK trends
        timestamps = [r['timestamp'] for r in history_list]
        N_values = [r.get('N_mgkg', 0) for r in history_list]
        P_values = [r.get('P_mgkg', 0) for r in history_list]
        K_values = [r.get('K_mgkg', 0) for r in history_list]
        
        return {
            'zone_id': zone_id,
            'period_days': days,
            'data_points': len(history_list),
            'nutrients': {
                'nitrogen': {
                    'current': N_values[-1],
                    'average': np.mean(N_values),
                    'trend': self._calculate_trend(N_values),
                    'optimal_range': [180, 250]
                },
                'phosphorus': {
                    'current': P_values[-1],
                    'average': np.mean(P_values),
                    'trend': self._calculate_trend(P_values),
                    'optimal_range': [15, 30]
                },
                'potassium': {
                    'current': K_values[-1],
                    'average': np.mean(K_values),
                    'trend': self._calculate_trend(K_values),
                    'optimal_range': [140, 200]
                }
            },
            'balance_status': self._assess_nutrient_balance(N_values[-1], P_values[-1], K_values[-1])
        }
    
    def _calculate_trend(self, values):
        """Calculate trend direction"""
        if len(values) < 2:
            return 'STABLE'
        
        first_half = np.mean(values[:len(values)//2])
        second_half = np.mean(values[len(values)//2:])
        
        diff_pct = ((second_half - first_half) / first_half) * 100 if first_half > 0 else 0
        
        if diff_pct > 10:
            return 'INCREASING'
        elif diff_pct < -10:
            return 'DECREASING'
        else:
            return 'STABLE'
    
    def _assess_nutrient_balance(self, N, P, K):
        """Assess overall nutrient balance"""
        N_status = 'optimal' if 180 <= N <= 250 else 'low' if N < 180 else 'high'
        P_status = 'optimal' if 15 <= P <= 30 else 'low' if P < 15 else 'high'
        K_status = 'optimal' if 140 <= K <= 200 else 'low' if K < 140 else 'high'
        
        optimal_count = [N_status, P_status, K_status].count('optimal')
        
        if optimal_count == 3:
            return 'BALANCED'
        elif optimal_count >= 2:
            return 'MOSTLY_BALANCED'
        else:
            return 'IMBALANCED'
    
    def get_crop_stress_history(self, zone_id, days=30):
        """Track crop stress levels over time"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        history = list(self.mongo_client.db.sensor_readings.find({
            'zone_id': zone_id,
            'timestamp': {'$gte': cutoff_date}
        }).sort('timestamp', 1))
        
        if not history:
            return {'message': 'No stress data available'}
        
        stress_values = [r.get('stress_level', 0) for r in history]
        health_values = [r.get('leaf_health_score', 80) for r in history]
        
        return {
            'zone_id': zone_id,
            'period_days': days,
            'stress_analysis': {
                'current_stress': stress_values[-1],
                'average_stress': np.mean(stress_values),
                'max_stress': max(stress_values),
                'trend': self._calculate_trend(stress_values),
                'high_stress_days': sum(1 for s in stress_values if s > 6)
            },
            'health_analysis': {
                'current_health': health_values[-1],
                'average_health': np.mean(health_values),
                'min_health': min(health_values),
                'trend': self._calculate_trend(health_values)
            },
            'recommendations': self._get_stress_recommendations(stress_values[-1], health_values[-1])
        }
    
    def _get_stress_recommendations(self, stress, health):
        """Get recommendations based on stress and health"""
        recommendations = []
        
        if stress > 7:
            recommendations.append('🔴 HIGH STRESS - Investigate causes immediately (drought, pests, disease)')
            recommendations.append('Increase monitoring frequency to twice daily')
        elif stress > 5:
            recommendations.append('🟡 MODERATE STRESS - Review irrigation and nutrient schedule')
        
        if health < 70:
            recommendations.append('⚠️ LOW HEALTH - Check for disease, pest damage, or nutrient deficiency')
            recommendations.append('Consider applying foliar nutrients for quick boost')
        
        if not recommendations:
            recommendations.append('✅ Good condition - maintain current care practices')
        
        return recommendations
