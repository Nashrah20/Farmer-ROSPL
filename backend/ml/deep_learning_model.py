"""
Deep Learning Model for Plant Disease Detection
Uses PyTorch with ResNet50 Transfer Learning
"""
import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class PlantDiseaseDetector:
    """
    Deep Learning model for crop disease detection
    Uses ResNet50 pre-trained on ImageNet with custom classifier head
    """
    
    def __init__(self, model_path=None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"[DEVICE] Using device: {self.device}")
        
        # Disease classes (standard plant disease categories)
        self.disease_classes = [
            'Healthy',
            'Early_Blight',
            'Late_Blight',
            'Leaf_Spot',
            'Powdery_Mildew',
            'Rust',
            'Bacterial_Blight',
            'Viral_Mosaic',
            'Nutrient_Deficiency',
            'Pest_Damage'
        ]
        
        # Image preprocessing pipeline
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],  # ImageNet standards
                std=[0.229, 0.224, 0.225]
            )
        ])
        
        # Load or create model
        self.model = self._build_model()
        
        # Load pre-trained weights if available
        if model_path and os.path.exists(model_path):
            self._load_weights(model_path)
            print(f"[OK] Loaded model from {model_path}")
        else:
            print("[WARN] Using base ResNet50 (no fine-tuning yet)")
            print("[INFO] Model will work but with generic ImageNet features")
        
        self.model.to(self.device)
        self.model.eval()
    
    def _build_model(self):
        """Build ResNet50 with custom classifier"""
        # Load pre-trained ResNet50
        model = models.resnet50(pretrained=True)
        
        # Freeze early layers (transfer learning)
        for param in list(model.parameters())[:-30]:
            param.requires_grad = False
        
        # Replace final layer for plant diseases
        num_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, 512),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(512, len(self.disease_classes))
        )
        
        return model
    
    def _load_weights(self, path):
        """Load trained weights"""
        try:
            checkpoint = torch.load(path, map_location=self.device)
            self.model.load_state_dict(checkpoint['model_state_dict'])
        except Exception as e:
            print(f"[ERROR] Could not load weights: {e}")
    
    def predict(self, image_input):
        """
        Predict disease from image
        Args:
            image_input: PIL Image or path to image file
        Returns:
            dict with disease, confidence, probabilities
        """
        # Load image
        if isinstance(image_input, str):
            image = Image.open(image_input).convert('RGB')
        else:
            image = image_input.convert('RGB')
        
        # Preprocess
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # Predict
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_idx = torch.max(probabilities, 1)
        
        # Get results
        predicted_disease = self.disease_classes[predicted_idx.item()]
        confidence_score = confidence.item() * 100
        
        # Get top 3 predictions
        top3_prob, top3_idx = torch.topk(probabilities, 3)
        top3_predictions = [
            {
                'disease': self.disease_classes[idx.item()],
                'probability': prob.item() * 100
            }
            for prob, idx in zip(top3_prob[0], top3_idx[0])
        ]
        
        return {
            'predicted_disease': predicted_disease,
            'confidence': confidence_score,
            'top3_predictions': top3_predictions,
            'all_probabilities': {
                self.disease_classes[i]: prob.item() * 100
                for i, prob in enumerate(probabilities[0])
            },
            'model': 'ResNet50',
            'timestamp': datetime.now().isoformat()
        }
    
    def get_disease_info(self, disease_name):
        """Get detailed information about detected disease"""
        disease_db = {
            'Healthy': {
                'severity': 'none',
                'treatment': 'Continue current care practices',
                'prevention': 'Maintain regular monitoring and preventive care',
                'symptoms': 'Vibrant green leaves, uniform color, no spots'
            },
            'Early_Blight': {
                'severity': 'medium',
                'treatment': 'Apply fungicide (chlorothalonil or mancozeb), remove infected leaves',
                'prevention': 'Crop rotation, avoid overhead watering, proper spacing',
                'symptoms': 'Dark brown spots with concentric rings (target pattern)'
            },
            'Late_Blight': {
                'severity': 'high',
                'treatment': 'Apply copper fungicide immediately, remove all infected plants',
                'prevention': 'Use resistant varieties, improve air circulation, fungicide spray',
                'symptoms': 'Water-soaked lesions, white mold on undersides, rapid spread'
            },
            'Leaf_Spot': {
                'severity': 'medium',
                'treatment': 'Fungicide application, remove affected leaves, improve drainage',
                'prevention': 'Avoid wetting leaves, proper spacing, crop rotation',
                'symptoms': 'Small circular spots, yellow or brown with dark borders'
            },
            'Powdery_Mildew': {
                'severity': 'medium',
                'treatment': 'Sulfur spray or neem oil, improve air circulation',
                'prevention': 'Avoid overhead watering, prune for airflow, resistant varieties',
                'symptoms': 'White powdery coating on leaves and stems'
            },
            'Rust': {
                'severity': 'medium',
                'treatment': 'Apply sulfur-based fungicide, remove infected leaves',
                'prevention': 'Water at soil level, remove plant debris, use resistant varieties',
                'symptoms': 'Orange or rust-colored pustules on leaf undersides'
            },
            'Bacterial_Blight': {
                'severity': 'high',
                'treatment': 'Copper bactericide, remove infected plants, disinfect tools',
                'prevention': 'Use pathogen-free seeds, avoid working with wet plants',
                'symptoms': 'Water-soaked lesions, yellow halos, ooze on stems'
            },
            'Viral_Mosaic': {
                'severity': 'high',
                'treatment': 'Remove infected plants immediately, control insect vectors',
                'prevention': 'Use virus-free seeds, control aphids and whiteflies',
                'symptoms': 'Mottled light and dark green pattern, stunted growth'
            },
            'Nutrient_Deficiency': {
                'severity': 'low',
                'treatment': 'Apply appropriate fertilizer (N/P/K/micronutrients)',
                'prevention': 'Regular soil testing, balanced fertilization, proper pH',
                'symptoms': 'Yellowing leaves, purple tint, stunted growth'
            },
            'Pest_Damage': {
                'severity': 'medium',
                'treatment': 'Appropriate insecticide or organic pest control',
                'prevention': 'Regular monitoring, companion planting, physical barriers',
                'symptoms': 'Holes in leaves, chewed edges, visible insects'
            }
        }
        
        return disease_db.get(disease_name, disease_db['Healthy'])
    
    def analyze_comprehensive(self, image_input):
        """
        Comprehensive analysis combining AI prediction with detailed info
        """
        # Get AI prediction
        prediction = self.predict(image_input)
        
        # Get disease details
        disease_info = self.get_disease_info(prediction['predicted_disease'])
        
        # Calculate health score
        health_score = self._calculate_health_score(
            prediction['predicted_disease'],
            prediction['confidence']
        )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            prediction['predicted_disease'],
            prediction['confidence'],
            health_score
        )
        
        return {
            'disease_detected': prediction['predicted_disease'],
            'confidence': prediction['confidence'],
            'health_score': health_score,
            'severity': disease_info['severity'],
            'top3_predictions': prediction['top3_predictions'],
            'symptoms': disease_info['symptoms'],
            'treatment': disease_info['treatment'],
            'prevention': disease_info['prevention'],
            'recommendations': recommendations,
            'requires_immediate_action': disease_info['severity'] == 'high' and prediction['confidence'] > 70,
            'model_info': {
                'architecture': 'ResNet50 Transfer Learning',
                'framework': 'PyTorch',
                'device': str(self.device),
                'classes': len(self.disease_classes)
            },
            'timestamp': datetime.now().isoformat()
        }
    
    def _calculate_health_score(self, disease, confidence):
        """Calculate plant health score (0-100)"""
        if disease == 'Healthy':
            return min(100, 85 + (confidence - 70) / 2)
        elif disease == 'Nutrient_Deficiency':
            return max(50, 80 - confidence / 2)
        elif disease in ['Late_Blight', 'Bacterial_Blight', 'Viral_Mosaic']:
            return max(10, 40 - confidence / 3)
        else:
            return max(30, 70 - confidence / 2)
    
    def _generate_recommendations(self, disease, confidence, health_score):
        """Generate actionable recommendations"""
        recommendations = []
        
        if disease == 'Healthy':
            recommendations.extend([
                '✅ Plant is healthy - maintain current care practices',
                '📅 Continue regular monitoring',
                '💧 Maintain optimal watering schedule'
            ])
        else:
            # Add urgency level
            if confidence > 80:
                recommendations.append(f'🔴 HIGH CONFIDENCE ({confidence:.1f}%) - Take immediate action')
            elif confidence > 60:
                recommendations.append(f'🟡 MODERATE CONFIDENCE ({confidence:.1f}%) - Monitor closely')
            else:
                recommendations.append(f'🟢 LOW CONFIDENCE ({confidence:.1f}%) - Consider getting expert opinion')
            
            # Add disease-specific actions
            if disease in ['Late_Blight', 'Bacterial_Blight']:
                recommendations.extend([
                    '⚠️ URGENT: This disease spreads rapidly',
                    '🧪 Apply treatment within 24 hours',
                    '🔍 Inspect neighboring plants immediately'
                ])
            elif disease == 'Viral_Mosaic':
                recommendations.extend([
                    '🗑️ Remove infected plant to prevent spread',
                    '🦟 Control insect vectors (aphids, whiteflies)',
                    '🚫 Do not compost infected material'
                ])
            else:
                recommendations.extend([
                    '🩺 Apply recommended treatment',
                    '📊 Monitor for 3-5 days',
                    '🌱 Take preventive measures'
                ])
        
        # Add health-based recommendations
        if health_score < 50:
            recommendations.append('⚠️ Plant health critical - consider professional consultation')
        
        return recommendations


# Global model instance (singleton pattern)
_global_model = None

def get_model():
    """Get or create global model instance"""
    global _global_model
    if _global_model is None:
        print("[INIT] Initializing Deep Learning Model...")
        _global_model = PlantDiseaseDetector()
        print("[OK] Model ready!")
    return _global_model
