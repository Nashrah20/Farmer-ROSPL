"""
Image Analysis Module for Crop Health Detection
Uses Google Gemini AI Vision for accurate plant disease detection
"""
import os
import numpy as np
from datetime import datetime
from PIL import Image
import io
import base64

# Import AI Vision Service (Gemini)
try:
    from .ai_vision_service import get_ai_vision_service
    AI_VISION_AVAILABLE = True
    print("[OK] AI Vision Service loaded")
except Exception as e:
    print(f"[ERROR] AI Vision Service not available: {e}")
    AI_VISION_AVAILABLE = False

class CropImageAnalyzer:
    """
    Analyzes crop and leaf images for disease detection
    Hybrid approach: Uses ResNet50 AI model with rule-based fallback
    """
    
    def __init__(self):
        self.supported_formats = ['jpg', 'jpeg', 'png', 'webp']
        print("[OK] CropImageAnalyzer initialized with Gemini AI")
    
    def _load_disease_database(self):
        """Load disease symptom database"""
        return {
            'fungal_blight': {
                'symptoms': ['dark spots', 'yellowing', 'wilting', 'brown patches'],
                'color_indicators': 'brown/black spots on green/yellow background',
                'severity_levels': ['mild', 'moderate', 'severe'],
                'treatment': 'Apply fungicide (copper-based), remove infected leaves, improve air circulation',
                'prevention': 'Avoid overhead watering, ensure proper spacing, use resistant varieties'
            },
            'bacterial_spot': {
                'symptoms': ['water-soaked lesions', 'yellow halos', 'leaf drop'],
                'color_indicators': 'dark spots with yellow rings',
                'severity_levels': ['early', 'progressive', 'severe'],
                'treatment': 'Apply copper bactericide, remove infected plants, disinfect tools',
                'prevention': 'Use pathogen-free seeds, avoid working with wet plants, crop rotation'
            },
            'viral_mosaic': {
                'symptoms': ['mottled pattern', 'stunted growth', 'leaf distortion'],
                'color_indicators': 'light and dark green mosaic pattern',
                'severity_levels': ['mild', 'moderate', 'severe'],
                'treatment': 'Remove infected plants immediately, control insect vectors',
                'prevention': 'Use virus-free seeds, control aphids and whiteflies, remove weeds'
            },
            'nutrient_deficiency': {
                'symptoms': ['yellowing', 'purple tint', 'stunted growth', 'leaf curl'],
                'color_indicators': 'overall yellow or purple discoloration',
                'severity_levels': ['early', 'moderate', 'severe'],
                'treatment': 'Apply appropriate fertilizer based on deficiency type (N/P/K/micronutrients)',
                'prevention': 'Regular soil testing, balanced fertilization, proper pH maintenance'
            },
            'pest_damage': {
                'symptoms': ['holes in leaves', 'chewed edges', 'visible insects', 'honeydew'],
                'color_indicators': 'irregular holes, brown edges',
                'severity_levels': ['light', 'moderate', 'heavy'],
                'treatment': 'Apply appropriate insecticide or organic pest control, introduce beneficial insects',
                'prevention': 'Regular monitoring, crop rotation, companion planting, physical barriers'
            },
            'drought_stress': {
                'symptoms': ['wilting', 'dry edges', 'leaf curl', 'browning'],
                'color_indicators': 'brown/crispy leaf edges, overall wilting',
                'severity_levels': ['early', 'moderate', 'severe'],
                'treatment': 'Increase irrigation frequency, apply mulch, provide shade during peak heat',
                'prevention': 'Maintain consistent soil moisture, use drought-tolerant varieties, mulching'
            },
            'healthy': {
                'symptoms': ['vibrant green', 'uniform color', 'no spots', 'turgid leaves'],
                'color_indicators': 'bright green, consistent coloration',
                'severity_levels': ['excellent'],
                'treatment': 'Continue current care practices',
                'prevention': 'Maintain regular monitoring and preventive care'
            }
        }
    
    def analyze_image_from_file(self, image_path):
        """Analyze image from file path"""
        try:
            with Image.open(image_path) as img:
                return self._analyze_image(img, source=image_path)
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to load image: {str(e)}'
            }
    
    def analyze_image_from_base64(self, base64_string):
        """Analyze image from base64 encoded string"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            image_data = base64.b64decode(base64_string)
            img = Image.open(io.BytesIO(image_data))
            return self._analyze_image(img, source='uploaded_image')
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to decode image: {str(e)}'
            }
    
    def _analyze_image(self, img, source='unknown'):
        """Core image analysis logic - Uses Gemini AI Vision"""
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Use AI Vision Service (Gemini)
        if AI_VISION_AVAILABLE:
            try:
                ai_vision = get_ai_vision_service()
                if ai_vision and ai_vision.is_available():
                    print(f"[AI-VISION] Using {ai_vision.provider} for analysis...")
                    vision_result = ai_vision.analyze_plant_image(img)
                    
                    # Convert to expected format
                    return {
                        'success': True,
                        'analysis_method': vision_result.get('analysis_method', 'ai_vision'),
                        'model': vision_result.get('model', 'AI Vision'),
                        'timestamp': vision_result.get('timestamp'),
                        'health_status': vision_result.get('health_status', 'UNKNOWN'),
                        'health_score': vision_result.get('health_score', 50),
                        'disease_name': vision_result.get('disease_detected', 'Unknown'),
                        'disease_probability': f"{vision_result.get('confidence', 0):.1f}%",
                        'confidence': {
                            'level': 'high' if vision_result.get('confidence', 0) > 75 else 'medium' if vision_result.get('confidence', 0) > 50 else 'low',
                            'score': round(vision_result.get('confidence', 0))
                        },
                        'severity': vision_result.get('severity', 'unknown'),
                        'symptoms': vision_result.get('symptoms', 'Analysis completed'),
                        'treatment': vision_result.get('treatment', 'Consult expert'),
                        'prevention': vision_result.get('prevention', 'Regular monitoring'),
                        'recommendations': vision_result.get('recommendations', []),
                        'requires_immediate_action': vision_result.get('severity') == 'high',
                        'top_predictions': [],
                        'model_info': {
                            'provider': ai_vision.provider,
                            'model': vision_result.get('model')
                        },
                        'color_analysis': vision_result.get('color_analysis', {
                            'green_dominance': 0,
                            'brown_tissue_pct': 0,
                            'dark_spots_pct': 0,
                            'yellowing_pct': 0
                        }),
                        'anomalies': [{
                            'severity': vision_result.get('severity', 'unknown'),
                            'description': vision_result.get('symptoms', '')
                        }] if vision_result.get('health_status') == 'DISEASED' else []
                    }
            except Exception as e:
                print(f"[ERROR] AI Vision failed: {e}")
                import traceback
                traceback.print_exc()
        
        # Fallback: Return error if Gemini not available
        return {
            'success': False,
            'error': 'AI Vision service not configured. Please set GOOGLE_API_KEY environment variable.',
            'analysis_method': 'none',
            'timestamp': datetime.now().isoformat()
        }
        
        # Resize for consistent analysis
        img_resized = img.resize((512, 512))
        
        # Convert to numpy array
        img_array = np.array(img_resized)
        
        # Extract color features
        color_features = self._extract_color_features(img_array)
        
        # Analyze texture
        texture_features = self._analyze_texture(img_array)
        
        # Detect anomalies
        anomalies = self._detect_anomalies(img_array, color_features, texture_features)
        
        # Classify health status
        health_classification = self._classify_health(color_features, texture_features, anomalies)
        
        # Generate detailed report
        report = self._generate_report(health_classification, anomalies, color_features)
        
        return {
            'success': True,
            'analysis_method': 'rule_based',
            'model': 'Heuristic Color Analysis',
            'source': source,
            'timestamp': datetime.now().isoformat(),
            'image_size': img.size,
            'analysis': report
        }

    
    def _extract_color_features(self, img_array):
        """Extract color-based features"""
        # Average colors
        avg_red = np.mean(img_array[:,:,0])
        avg_green = np.mean(img_array[:,:,1])
        avg_blue = np.mean(img_array[:,:,2])
        
        # Color ratios
        green_dominance = avg_green / (avg_red + avg_blue + 1e-6)
        
        # Detect brown/yellow regions (potential disease)
        brown_mask = (img_array[:,:,0] > 100) & (img_array[:,:,1] > 80) & (img_array[:,:,2] < 80)
        brown_percentage = np.sum(brown_mask) / brown_mask.size * 100
        
        # Detect dark spots (potential disease)
        dark_mask = np.mean(img_array, axis=2) < 80
        dark_spot_percentage = np.sum(dark_mask) / dark_mask.size * 100
        
        # Detect yellowing
        yellow_mask = (img_array[:,:,0] > 180) & (img_array[:,:,1] > 180) & (img_array[:,:,2] < 120)
        yellow_percentage = np.sum(yellow_mask) / yellow_mask.size * 100
        
        return {
            'avg_red': float(avg_red),
            'avg_green': float(avg_green),
            'avg_blue': float(avg_blue),
            'green_dominance': float(green_dominance),
            'brown_percentage': float(brown_percentage),
            'dark_spot_percentage': float(dark_spot_percentage),
            'yellow_percentage': float(yellow_percentage)
        }
    
    def _analyze_texture(self, img_array):
        """Analyze texture for uniformity"""
        # Convert to grayscale
        gray = np.mean(img_array, axis=2)
        
        # Calculate standard deviation (texture uniformity)
        texture_std = np.std(gray)
        
        # Calculate edge density (irregular edges may indicate disease)
        edges = np.abs(np.diff(gray, axis=0)).sum() + np.abs(np.diff(gray, axis=1)).sum()
        edge_density = edges / gray.size
        
        return {
            'texture_std': float(texture_std),
            'edge_density': float(edge_density),
            'uniformity': 'high' if texture_std < 30 else 'medium' if texture_std < 50 else 'low'
        }
    
    def _detect_anomalies(self, img_array, color_features, texture_features):
        """Detect various anomalies"""
        anomalies = []
        
        # Check for excessive browning
        if color_features['brown_percentage'] > 15:
            anomalies.append({
                'type': 'browning',
                'severity': 'high' if color_features['brown_percentage'] > 30 else 'moderate',
                'description': f"{color_features['brown_percentage']:.1f}% brown/dead tissue detected"
            })
        
        # Check for dark spots
        if color_features['dark_spot_percentage'] > 10:
            anomalies.append({
                'type': 'dark_spots',
                'severity': 'high' if color_features['dark_spot_percentage'] > 25 else 'moderate',
                'description': f"{color_features['dark_spot_percentage']:.1f}% dark spots detected"
            })
        
        # Check for yellowing
        if color_features['yellow_percentage'] > 20:
            anomalies.append({
                'type': 'yellowing',
                'severity': 'high' if color_features['yellow_percentage'] > 40 else 'moderate',
                'description': f"{color_features['yellow_percentage']:.1f}% yellowing detected"
            })
        
        # Check for low green dominance
        if color_features['green_dominance'] < 1.2:
            anomalies.append({
                'type': 'poor_health',
                'severity': 'moderate',
                'description': 'Low chlorophyll levels indicated by color analysis'
            })
        
        # Check texture irregularity
        if texture_features['uniformity'] == 'low':
            anomalies.append({
                'type': 'irregular_texture',
                'severity': 'moderate',
                'description': 'Irregular leaf texture detected - possible disease or pest damage'
            })
        
        return anomalies
    
    def _classify_health(self, color_features, texture_features, anomalies):
        """Classify overall health status"""
        health_score = 100.0
        
        # Deduct points for issues
        for anomaly in anomalies:
            if anomaly['severity'] == 'high':
                health_score -= 20
            elif anomaly['severity'] == 'moderate':
                health_score -= 10
            else:
                health_score -= 5
        
        # Classify based on score
        if health_score >= 85:
            status = 'HEALTHY'
            disease_probability = 'low'
        elif health_score >= 70:
            status = 'FAIR'
            disease_probability = 'low-moderate'
        elif health_score >= 50:
            status = 'STRESSED'
            disease_probability = 'moderate'
        else:
            status = 'DISEASED'
            disease_probability = 'high'
        
        # Identify likely disease type
        likely_disease = self._identify_disease_type(color_features, anomalies)
        
        return {
            'status': status,
            'health_score': max(0, health_score),
            'disease_probability': disease_probability,
            'likely_disease': likely_disease,
            'confidence': self._calculate_confidence(anomalies)
        }
    
    def _identify_disease_type(self, color_features, anomalies):
        """Identify most likely disease type"""
        if not anomalies:
            return 'healthy'
        
        # Check anomaly types
        anomaly_types = [a['type'] for a in anomalies]
        
        if 'dark_spots' in anomaly_types and color_features['brown_percentage'] > 15:
            return 'fungal_blight'
        elif 'yellowing' in anomaly_types and color_features['yellow_percentage'] > 30:
            if any(a['severity'] == 'high' for a in anomalies):
                return 'viral_mosaic'
            else:
                return 'nutrient_deficiency'
        elif 'browning' in anomaly_types:
            if color_features['brown_percentage'] > 40:
                return 'drought_stress'
            else:
                return 'bacterial_spot'
        elif 'irregular_texture' in anomaly_types:
            return 'pest_damage'
        else:
            return 'stressed'
    
    def _calculate_confidence(self, anomalies):
        """Calculate confidence in diagnosis"""
        if not anomalies:
            return {'level': 'HIGH', 'score': 95}
        
        # More anomalies = higher confidence in problem detection
        high_severity_count = sum(1 for a in anomalies if a['severity'] == 'high')
        
        if high_severity_count >= 2:
            return {'level': 'HIGH', 'score': 85}
        elif len(anomalies) >= 2:
            return {'level': 'MEDIUM', 'score': 70}
        else:
            return {'level': 'MEDIUM', 'score': 60}
    
    def _generate_report(self, classification, anomalies, color_features):
        """Generate comprehensive analysis report"""
        disease_key = classification['likely_disease']
        disease_info = self.disease_database.get(disease_key, {})
        
        # Generate recommendations
        recommendations = []
        if classification['status'] != 'HEALTHY':
            recommendations.extend([
                disease_info.get('treatment', 'Consult agricultural expert for treatment'),
                'Monitor plant closely over next 3-5 days',
                'Take preventive measures for surrounding plants'
            ])
            
            # Add specific recommendations based on anomalies
            for anomaly in anomalies:
                if anomaly['type'] == 'yellowing':
                    recommendations.append('Apply nitrogen-rich fertilizer if nutrient deficiency confirmed')
                elif anomaly['type'] == 'browning':
                    recommendations.append('Check irrigation schedule and adjust if needed')
                elif anomaly['type'] == 'dark_spots':
                    recommendations.append('Remove affected leaves to prevent spread')
        else:
            recommendations.append('Continue current care practices - plant is healthy!')
        
        return {
            'health_status': classification['status'],
            'health_score': classification['health_score'],
            'disease_detected': disease_key,
            'disease_name': disease_key.replace('_', ' ').title(),
            'disease_probability': classification['disease_probability'],
            'confidence': classification['confidence'],
            'symptoms_detected': disease_info.get('symptoms', []),
            'anomalies': anomalies,
            'color_analysis': {
                'green_dominance': color_features['green_dominance'],
                'brown_tissue_pct': color_features['brown_percentage'],
                'dark_spots_pct': color_features['dark_spot_percentage'],
                'yellowing_pct': color_features['yellow_percentage']
            },
            'recommendations': recommendations,
            'treatment': disease_info.get('treatment', 'Consult expert'),
            'prevention': disease_info.get('prevention', 'Regular monitoring'),
            'severity': anomalies[0]['severity'] if anomalies else 'none',
            'requires_immediate_action': classification['health_score'] < 50
        }
    
    def batch_analyze(self, image_paths):
        """Analyze multiple images in batch"""
        results = []
        for path in image_paths:
            result = self.analyze_image_from_file(path)
            results.append(result)
        
        # Generate batch summary
        summary = self._generate_batch_summary(results)
        
        return {
            'batch_size': len(results),
            'results': results,
            'summary': summary
        }
    
    def _generate_batch_summary(self, results):
        """Generate summary for batch analysis"""
        successful = [r for r in results if r.get('success')]
        
        if not successful:
            return {'message': 'No successful analyses'}
        
        health_statuses = [r['analysis']['health_status'] for r in successful]
        avg_health_score = np.mean([r['analysis']['health_score'] for r in successful])
        
        return {
            'total_images': len(results),
            'successful_analyses': len(successful),
            'average_health_score': float(avg_health_score),
            'healthy_count': health_statuses.count('HEALTHY'),
            'stressed_count': health_statuses.count('STRESSED'),
            'diseased_count': health_statuses.count('DISEASED'),
            'overall_status': 'HEALTHY' if avg_health_score >= 80 else 'NEEDS_ATTENTION'
        }

# Global analyzer instance
image_analyzer = CropImageAnalyzer()
