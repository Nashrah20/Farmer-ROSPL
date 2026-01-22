"""
Deep Reinforcement Learning Module for FarmAI
Implements reward-based learning for continuous improvement
"""
import numpy as np
from datetime import datetime
import json

class RewardBasedLearning:
    """
    Deep Reinforcement Learning system for farming recommendations
    Tracks outcomes and adjusts recommendations based on feedback
    """
    
    def __init__(self):
        self.learning_rate = 0.1
        self.discount_factor = 0.9
        self.exploration_rate = 0.2
        self.reward_history = []
        
    def calculate_reward(self, predicted_action, actual_outcome, sensor_data_before, sensor_data_after):
        """
        Calculate reward based on action outcome
        
        Positive rewards:
        - Soil moisture improved and stayed in optimal range
        - Nutrient levels increased appropriately
        - Plant health improved
        - Resource efficiency (less waste)
        
        Negative rewards:
        - Over-irrigation (soil moisture too high)
        - Under-irrigation (soil moisture too low)
        - Nutrient imbalance
        - Plant stress increased
        """
        reward = 0.0
        reasons = []
        
        # Soil Moisture Reward (most important for irrigation)
        moisture_before = sensor_data_before.get('soil_moisture_pct', 50)
        moisture_after = sensor_data_after.get('soil_moisture_pct', 50)
        
        optimal_moisture_range = (40, 70)
        
        if optimal_moisture_range[0] <= moisture_after <= optimal_moisture_range[1]:
            if moisture_before < optimal_moisture_range[0]:
                reward += 10  # Successfully brought moisture to optimal
                reasons.append(f"+10: Improved moisture from {moisture_before:.1f}% to optimal {moisture_after:.1f}%")
            elif moisture_before > optimal_moisture_range[1]:
                reward += 5  # Reduced excess moisture
                reasons.append(f"+5: Reduced excess moisture from {moisture_before:.1f}% to {moisture_after:.1f}%")
            else:
                reward += 3  # Maintained optimal
                reasons.append(f"+3: Maintained optimal moisture at {moisture_after:.1f}%")
        else:
            if moisture_after > 85:
                reward -= 8  # Over-irrigation penalty
                reasons.append(f"-8: Over-irrigation detected ({moisture_after:.1f}%)")
            elif moisture_after < 30:
                reward -= 10  # Under-irrigation penalty
                reasons.append(f"-10: Under-irrigation detected ({moisture_after:.1f}%)")
            else:
                reward -= 2  # Suboptimal moisture
                reasons.append(f"-2: Suboptimal moisture ({moisture_after:.1f}%)")
        
        # Nutrient Management Reward
        nutrients = ['N_mgkg', 'P_mgkg', 'K_mgkg']
        optimal_ranges = {
            'N_mgkg': (180, 250),
            'P_mgkg': (15, 30),
            'K_mgkg': (140, 200)
        }
        
        for nutrient in nutrients:
            before = sensor_data_before.get(nutrient, 0)
            after = sensor_data_after.get(nutrient, 0)
            opt_min, opt_max = optimal_ranges[nutrient]
            
            if opt_min <= after <= opt_max:
                if before < opt_min:
                    reward += 5
                    reasons.append(f"+5: Improved {nutrient} from {before:.0f} to optimal {after:.0f}")
                else:
                    reward += 2
                    reasons.append(f"+2: Maintained optimal {nutrient} at {after:.0f}")
            elif after > opt_max * 1.5:
                reward -= 5  # Over-fertilization penalty
                reasons.append(f"-5: Over-fertilization of {nutrient} ({after:.0f})")
            elif after < opt_min * 0.7:
                reward -= 3  # Under-fertilization penalty
                reasons.append(f"-3: {nutrient} still deficient ({after:.0f})")
        
        # Plant Health Reward
        health_before = sensor_data_before.get('leaf_health_score', 80)
        health_after = sensor_data_after.get('leaf_health_score', 80)
        
        health_change = health_after - health_before
        if health_change > 5:
            reward += 8
            reasons.append(f"+8: Significant health improvement (+{health_change:.1f} points)")
        elif health_change > 0:
            reward += 3
            reasons.append(f"+3: Health improved by {health_change:.1f} points")
        elif health_change < -5:
            reward -= 6
            reasons.append(f"-6: Health declined by {health_change:.1f} points")
        
        # Stress Level Reward
        stress_before = sensor_data_before.get('stress_level', 5)
        stress_after = sensor_data_after.get('stress_level', 5)
        
        stress_change = stress_before - stress_after  # Positive if stress reduced
        if stress_change > 2:
            reward += 7
            reasons.append(f"+7: Stress significantly reduced (from {stress_before} to {stress_after})")
        elif stress_change > 0:
            reward += 3
            reasons.append(f"+3: Stress reduced (from {stress_before} to {stress_after})")
        elif stress_change < -2:
            reward -= 5
            reasons.append(f"-5: Stress increased (from {stress_before} to {stress_after})")
        
        # Resource Efficiency Reward
        irrigation_amount = predicted_action.get('irrigation_liters', 0)
        fertilizer_total = (predicted_action.get('fertilizer_N_g', 0) + 
                          predicted_action.get('fertilizer_P_g', 0) + 
                          predicted_action.get('fertilizer_K_g', 0))
        
        # Reward efficient water use
        if irrigation_amount < 300 and optimal_moisture_range[0] <= moisture_after <= optimal_moisture_range[1]:
            reward += 5
            reasons.append(f"+5: Water-efficient irrigation ({irrigation_amount:.0f}L)")
        
        # Reward efficient fertilizer use
        if fertilizer_total < 300 and all(
            optimal_ranges[n][0] <= sensor_data_after.get(n, 0) <= optimal_ranges[n][1] 
            for n in nutrients
        ):
            reward += 5
            reasons.append(f"+5: Fertilizer-efficient ({fertilizer_total:.0f}g total)")
        
        # Overall outcome assessment
        if actual_outcome.get('success', False):
            reward += 5
            reasons.append("+5: Action successfully executed")
        else:
            reward -= 3
            reasons.append("-3: Action execution failed")
        
        # Record reward
        reward_record = {
            'timestamp': datetime.now().isoformat(),
            'reward': reward,
            'reasons': reasons,
            'predicted_action': predicted_action,
            'moisture_before': moisture_before,
            'moisture_after': moisture_after,
            'health_before': health_before,
            'health_after': health_after
        }
        
        self.reward_history.append(reward_record)
        
        return {
            'reward': reward,
            'reasons': reasons,
            'category': self._categorize_reward(reward),
            'learning_impact': self._calculate_learning_impact(reward)
        }
    
    def _categorize_reward(self, reward):
        """Categorize reward as positive, neutral, or negative"""
        if reward > 10:
            return "EXCELLENT"
        elif reward > 5:
            return "GOOD"
        elif reward > 0:
            return "POSITIVE"
        elif reward > -5:
            return "NEUTRAL"
        elif reward > -10:
            return "NEGATIVE"
        else:
            return "POOR"
    
    def _calculate_learning_impact(self, reward):
        """Calculate how much this reward affects future recommendations"""
        impact = abs(reward) * self.learning_rate
        return {
            'adjustment_factor': impact,
            'description': f"Future recommendations will be adjusted by {impact:.2f} based on this outcome"
        }
    
    def get_reward_statistics(self):
        """Get statistics on reward history"""
        if not self.reward_history:
            return {
                'total_records': 0,
                'message': 'No reward history available yet'
            }
        
        rewards = [r['reward'] for r in self.reward_history]
        
        return {
            'total_records': len(rewards),
            'average_reward': np.mean(rewards),
            'best_reward': max(rewards),
            'worst_reward': min(rewards),
            'positive_actions': sum(1 for r in rewards if r > 0),
            'negative_actions': sum(1 for r in rewards if r < 0),
            'success_rate': (sum(1 for r in rewards if r > 0) / len(rewards)) * 100,
            'recent_trend': self._analyze_trend(rewards[-10:] if len(rewards) > 10 else rewards),
            'learning_progress': self._calculate_learning_progress(rewards)
        }
    
    def _analyze_trend(self, recent_rewards):
        """Analyze recent reward trend"""
        if len(recent_rewards) < 2:
            return "Insufficient data"
        
        avg_first_half = np.mean(recent_rewards[:len(recent_rewards)//2])
        avg_second_half = np.mean(recent_rewards[len(recent_rewards)//2:])
        
        if avg_second_half > avg_first_half + 2:
            return "IMPROVING"
        elif avg_second_half < avg_first_half - 2:
            return "DECLINING"
        else:
            return "STABLE"
    
    def _calculate_learning_progress(self, rewards):
        """Calculate learning progress over time"""
        if len(rewards) < 5:
            return "Early stage - gathering data"
        
        recent_avg = np.mean(rewards[-10:]) if len(rewards) >= 10 else np.mean(rewards[-5:])
        overall_avg = np.mean(rewards)
        
        if recent_avg > overall_avg + 3:
            return "Strong improvement - system is learning effectively"
        elif recent_avg > overall_avg:
            return "Gradual improvement - system is learning"
        else:
            return "Needs attention - consider reviewing recommendation strategy"
    
    def provide_feedback(self, action_id, feedback_type, zone_id, comment=""):
        """
        Farmer provides manual feedback on recommendation
        feedback_type: 'excellent', 'good', 'neutral', 'poor'
        """
        feedback_rewards = {
            'excellent': 15,
            'good': 8,
            'neutral': 0,
            'poor': -10
        }
        
        reward = feedback_rewards.get(feedback_type, 0)
        
        feedback_record = {
            'timestamp': datetime.now().isoformat(),
            'action_id': action_id,
            'zone_id': zone_id,
            'feedback_type': feedback_type,
            'reward': reward,
            'comment': comment,
            'source': 'farmer_feedback'
        }
        
        self.reward_history.append(feedback_record)
        
        return {
            'success': True,
            'message': f'Thank you for your feedback! ({feedback_type})',
            'reward_applied': reward,
            'impact': 'Your feedback helps improve future recommendations'
        }

# Global RL instance
rl_system = RewardBasedLearning()
