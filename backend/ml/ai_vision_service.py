"""
AI Vision Service for Plant Disease Detection
Supports OpenAI GPT-4 Vision and Google Gemini
"""
import os
import base64
import json
from PIL import Image
import io
from datetime import datetime

class AIVisionService:
    """
    Use commercial AI vision models for plant disease detection
    Supports: OpenAI GPT-4 Vision, Google Gemini
    """
    
    def __init__(self, provider='openai'):
        """
        Initialize AI Vision Service
        
        Args:
            provider: 'openai' or 'gemini'
        """
        self.provider = provider.lower()
        self.api_key = None
        
        if self.provider == 'openai':
            self.api_key = os.getenv('OPENAI_API_KEY')
            if not self.api_key:
                print("[WARN] OPENAI_API_KEY not set in environment")
        elif self.provider == 'gemini':
            self.api_key = os.getenv('GOOGLE_API_KEY')
            if not self.api_key:
                print("[WARN] GOOGLE_API_KEY not set in environment")
        else:
            raise ValueError(f"Unsupported provider: {provider}. Use 'openai' or 'gemini'")
    
    def is_available(self):
        """Check if API key is configured"""
        return self.api_key is not None
    
    def analyze_plant_image(self, image_input):
        """
        Analyze plant image using AI vision model
        
        Args:
            image_input: PIL Image or file path
            
        Returns:
            dict with disease detection results
        """
        if not self.is_available():
            raise Exception(f"API key not configured for {self.provider}")
        
        # Convert image to base64
        if isinstance(image_input, str):
            image = Image.open(image_input).convert('RGB')
        else:
            image = image_input.convert('RGB')
        
        # Call appropriate provider
        if self.provider == 'openai':
            return self._analyze_with_openai(image)
        elif self.provider == 'gemini':
            return self._analyze_with_gemini(image)
    
    def _image_to_base64(self, image):
        """Convert PIL Image to base64"""
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    def _analyze_with_openai(self, image):
        """Analyze using OpenAI GPT-4 Vision"""
        try:
            import openai
        except ImportError:
            raise Exception("Please install: pip install openai")
        
        client = openai.OpenAI(api_key=self.api_key)
        
        # Convert image to base64
        img_base64 = self._image_to_base64(image)
        
        # Prepare prompt
        prompt = """Analyze this plant/crop leaf image for diseases. Provide detailed analysis in JSON format:

{
  "health_status": "HEALTHY or DISEASED",
  "health_score": 0-100,
  "disease_detected": "disease name or Healthy",
  "confidence": 0-100,
  "severity": "none/low/medium/high",
  "symptoms": "visible symptoms description",
  "likely_causes": ["cause1", "cause2"],
  "treatment": "recommended treatment",
  "prevention": "prevention measures",
  "recommendations": ["action1", "action2"],
  "color_analysis": {
    "dominant_colors": ["color1", "color2"],
    "has_browning": true/false,
    "has_yellowing": true/false,
    "has_spots": true/false
  }
}

Analyze carefully for: fungal diseases (blight, rust, mildew), bacterial infections, viral diseases, nutrient deficiencies, pest damage, or healthy condition."""

        # Call API
        print("[AI] Calling OpenAI GPT-4 Vision...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=800,
            temperature=0.3
        )
        
        # Parse response
        content = response.choices[0].message.content
        
        # Extract JSON from response
        try:
            # Try to find JSON in response
            if '```json' in content:
                json_str = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                json_str = content.split('```')[1].split('```')[0].strip()
            else:
                json_str = content.strip()
            
            result = json.loads(json_str)
        except:
            # Fallback parsing
            result = {
                'health_status': 'HEALTHY' if 'healthy' in content.lower() else 'DISEASED',
                'health_score': 75,
                'disease_detected': 'Analysis completed',
                'confidence': 70,
                'severity': 'medium',
                'symptoms': content[:200],
                'treatment': 'Consult expert for detailed treatment',
                'prevention': 'Regular monitoring and care',
                'recommendations': ['Continue monitoring', 'Consult agricultural expert'],
                'raw_response': content
            }
        
        # Add metadata
        result['analysis_method'] = 'openai_vision'
        result['model'] = 'gpt-4o-mini'
        result['timestamp'] = datetime.now().isoformat()
        result['success'] = True
        
        return result
    
    def _analyze_with_gemini(self, image):
        """Analyze using Google Gemini Vision"""
        try:
            import google.generativeai as genai
        except ImportError:
            raise Exception("Please install: pip install google-generativeai")
        
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Prepare prompt
        prompt = """Analyze this plant/crop leaf image for diseases. Provide detailed analysis in JSON format:

{
  "health_status": "HEALTHY or DISEASED",
  "health_score": 0-100,
  "disease_detected": "disease name or Healthy",
  "confidence": 0-100,
  "severity": "none/low/medium/high",
  "symptoms": "visible symptoms description",
  "likely_causes": ["cause1", "cause2"],
  "treatment": "recommended treatment",
  "prevention": "prevention measures",
  "recommendations": ["action1", "action2"],
  "color_analysis": {
    "dominant_colors": ["color1", "color2"],
    "has_browning": true/false,
    "has_yellowing": true/false,
    "has_spots": true/false
  }
}

Analyze carefully for: fungal diseases (blight, rust, mildew), bacterial infections, viral diseases, nutrient deficiencies, pest damage, or healthy condition."""

        # Call API
        print("[AI] Calling Google Gemini Vision...")
        response = model.generate_content([prompt, image])
        
        content = response.text
        
        # Extract JSON from response
        try:
            if '```json' in content:
                json_str = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                json_str = content.split('```')[1].split('```')[0].strip()
            else:
                json_str = content.strip()
            
            result = json.loads(json_str)
        except:
            # Fallback parsing
            result = {
                'health_status': 'HEALTHY' if 'healthy' in content.lower() else 'DISEASED',
                'health_score': 75,
                'disease_detected': 'Analysis completed',
                'confidence': 70,
                'severity': 'medium',
                'symptoms': content[:200],
                'treatment': 'Consult expert for detailed treatment',
                'prevention': 'Regular monitoring and care',
                'recommendations': ['Continue monitoring', 'Consult agricultural expert'],
                'raw_response': content
            }
        
        # Add metadata
        result['analysis_method'] = 'gemini_vision'
        result['model'] = 'gemini-1.5-flash'
        result['timestamp'] = datetime.now().isoformat()
        result['success'] = True
        
        return result

# Global instance
_ai_vision_service = None

def get_ai_vision_service(provider=None):
    """
    Get AI Vision Service instance
    
    Args:
        provider: 'openai', 'gemini', or None (auto-detect from env)
    """
    global _ai_vision_service
    
    if provider is None:
        # Auto-detect from environment
        if os.getenv('OPENAI_API_KEY'):
            provider = 'openai'
        elif os.getenv('GOOGLE_API_KEY'):
            provider = 'gemini'
        else:
            return None
    
    if _ai_vision_service is None or _ai_vision_service.provider != provider:
        try:
            _ai_vision_service = AIVisionService(provider=provider)
            if _ai_vision_service.is_available():
                print(f"[OK] AI Vision Service initialized: {provider}")
            else:
                _ai_vision_service = None
        except Exception as e:
            print(f"[ERROR] Failed to initialize AI Vision Service: {e}")
            _ai_vision_service = None
    
    return _ai_vision_service
