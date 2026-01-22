"""
Image Analysis Module for Crop Health Detection
Uses Google Gemini AI Vision for accurate plant disease detection
"""
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
    Analyzes crop and leaf images for disease detection using Gemini AI
    """
    
    def __init__(self):
        self.supported_formats = ['jpg', 'jpeg', 'png', 'webp']
        print("[OK] CropImageAnalyzer initialized with Gemini AI")
    
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
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            
            # Open image
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
                        'model': vision_result.get('model', 'Gemini AI Vision'),
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
        
        # Return error if Gemini not available
        return {
            'success': False,
            'error': 'AI Vision service not configured. Please set GOOGLE_API_KEY in .env file.',
            'analysis_method': 'none',
            'timestamp': datetime.now().isoformat()
        }

# Global image analyzer instance
image_analyzer = CropImageAnalyzer()
