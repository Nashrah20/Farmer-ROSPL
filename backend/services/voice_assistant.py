# Voice Assistant Service for Farmer-Friendly Interface
import json
from datetime import datetime

class VoiceAssistant:
    """
    Voice assistant to help farmers interact with the system
    Supports multiple languages and simple commands
    """
    
    def __init__(self):
        self.supported_languages = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu']
        self.commands = {
            'en': {
                'get_recommendation': ['recommendation', 'what should i do', 'advice', 'suggestion'],
                'check_weather': ['weather', 'rain', 'temperature'],
                'check_disease': ['disease', 'problem', 'sick', 'pest'],
                'check_price': ['price', 'market', 'rate', 'cost'],
                'check_yield': ['yield', 'production', 'harvest', 'crop'],
                'help': ['help', 'how to use', 'guide']
            },
            'hi': {
                'get_recommendation': ['sujhav', 'kya karna chahiye', 'salah'],
                'check_weather': ['mausam', 'barish', 'tapman'],
                'check_disease': ['bimari', 'samasya', 'keeda'],
                'check_price': ['daam', 'bhav', 'kimat', 'rate'],
                'check_yield': ['utpadan', 'fasal', 'paidavar'],
                'help': ['madad', 'sahayata']
            }
        }
        
        self.responses = {
            'en': {
                'welcome': 'Welcome to FarmAI! I am your farming assistant. How can I help you today?',
                'zone_required': 'Please select your farm zone first.',
                'processing': 'Let me check that for you...',
                'error': 'Sorry, I encountered an error. Please try again.',
                'unknown_command': 'I did not understand that. You can ask about weather, diseases, prices, or recommendations.'
            },
            'hi': {
                'welcome': 'FarmAI mein aapka swagat hai! Main aapka kheti sahaayak hoon. Aaj main aapki kaise madad kar sakta hoon?',
                'zone_required': 'Kripya pehle apna khet zone chuniye.',
                'processing': 'Main aapke liye dekhta hoon...',
                'error': 'Kshama kijiye, koi gadbadi hui. Kripya dobara koshish karein.',
                'unknown_command': 'Main samajh nahi paya. Aap mausam, bimari, daam, ya sujhav ke baare mein pooch sakte hain.'
            }
        }
    
    def process_voice_command(self, text, language='en', zone_id=None):
        """
        Process voice command and return appropriate response
        """
        text = text.lower().strip()
        responses = self.responses.get(language, self.responses['en'])
        
        # Check if zone is required but not provided
        commands_needing_zone = ['get_recommendation', 'check_disease', 'check_yield']
        
        # Match command
        command_type = self._match_command(text, language)
        
        if command_type in commands_needing_zone and not zone_id:
            return {
                'success': False,
                'message': responses['zone_required'],
                'requires_zone': True
            }
        
        # Generate response based on command
        response = {
            'success': True,
            'command': command_type,
            'language': language,
            'timestamp': datetime.now().isoformat()
        }
        
        if command_type == 'get_recommendation':
            response['action'] = 'fetch_recommendation'
            response['message'] = self._get_recommendation_message(language)
        
        elif command_type == 'check_weather':
            response['action'] = 'fetch_weather'
            response['message'] = self._get_weather_message(language)
        
        elif command_type == 'check_disease':
            response['action'] = 'fetch_disease_info'
            response['message'] = self._get_disease_message(language)
        
        elif command_type == 'check_price':
            response['action'] = 'fetch_prices'
            response['message'] = self._get_price_message(language)
        
        elif command_type == 'check_yield':
            response['action'] = 'fetch_yield'
            response['message'] = self._get_yield_message(language)
        
        elif command_type == 'help':
            response['action'] = 'show_help'
            response['message'] = self._get_help_message(language)
        
        else:
            response['success'] = False
            response['message'] = responses['unknown_command']
        
        return response
    
    def _match_command(self, text, language):
        """Match text to a command"""
        if language not in self.commands:
            language = 'en'
        
        for command_type, keywords in self.commands[language].items():
            for keyword in keywords:
                if keyword in text:
                    return command_type
        
        return 'unknown'
    
    def _get_recommendation_message(self, lang):
        messages = {
            'en': 'Getting your personalized farming recommendations...',
            'hi': 'Aapke liye kheti ke sujhav laaye ja rahe hain...'
        }
        return messages.get(lang, messages['en'])
    
    def _get_weather_message(self, lang):
        messages = {
            'en': 'Checking weather forecast for your area...',
            'hi': 'Aapke kshetra ka mausam dekha ja raha hai...'
        }
        return messages.get(lang, messages['en'])
    
    def _get_disease_message(self, lang):
        messages = {
            'en': 'Analyzing your crops for diseases and pests...',
            'hi': 'Aapki fasal mein bimari aur keede ka vishleshan kiya ja raha hai...'
        }
        return messages.get(lang, messages['en'])
    
    def _get_price_message(self, lang):
        messages = {
            'en': 'Fetching latest market prices...',
            'hi': 'Naye bazaar ke daamon ki jaankari layi ja rahi hai...'
        }
        return messages.get(lang, messages['en'])
    
    def _get_yield_message(self, lang):
        messages = {
            'en': 'Calculating estimated yield for your crops...',
            'hi': 'Aapki fasal ki anumani paidavar ka hisab lagaya ja raha hai...'
        }
        return messages.get(lang, messages['en'])
    
    def _get_help_message(self, lang):
        messages = {
            'en': 'You can ask me: "What should I do?", "Check weather", "Any disease?", "Market price", or "Expected yield"',
            'hi': 'Aap mujhse pooch sakte hain: "Kya karna chahiye?", "Mausam kaise hai?", "Koi bimari hai?", "Bazaar daam", ya "Utpadan kitna hoga?"'
        }
        return messages.get(lang, messages['en'])
    
    def text_to_speech_format(self, text, language='en'):
        """
        Format text for text-to-speech in a farmer-friendly way
        Break down complex terms into simpler language
        """
        # Replace technical terms with farmer-friendly language
        replacements = {
            'en': {
                'irrigation': 'watering',
                'fertilizer': 'khad',
                'nitrogen': 'N nutrient',
                'phosphorus': 'P nutrient',
                'potassium': 'K nutrient',
                'hectare': 'bigha',
                'kg': 'kilogram',
                'liters': 'litres',
            },
            'hi': {
                'irrigation': 'sinchai',
                'fertilizer': 'khad',
                'nitrogen': 'N khad',
                'phosphorus': 'P khad',
                'potassium': 'K khad',
                'disease': 'bimari',
                'pest': 'keeda',
                'yield': 'utpadan'
            }
        }
        
        if language in replacements:
            for tech_term, simple_term in replacements[language].items():
                text = text.replace(tech_term, simple_term)
        
        return text
    
    def format_prediction_for_voice(self, prediction_data, language='en'):
        """
        Convert complex prediction data into simple voice-friendly message
        """
        if language == 'en':
            message = f"Here are your recommendations. "
            
            # Irrigation
            irrigation = prediction_data.get('irrigation_liters', 0)
            if irrigation > 500:
                message += f"Give heavy watering of {int(irrigation)} liters. "
            elif irrigation > 200:
                message += f"Give moderate watering of {int(irrigation)} liters. "
            else:
                message += f"Light watering of {int(irrigation)} liters is enough. "
            
            # Fertilizer
            n = prediction_data.get('fertilizer_N_g', 0)
            p = prediction_data.get('fertilizer_P_g', 0)
            k = prediction_data.get('fertilizer_K_g', 0)
            
            if n > 100 or p > 50 or k > 80:
                message += f"Apply fertilizer: {int(n)} grams nitrogen, {int(p)} grams phosphorus, {int(k)} grams potassium. "
            
            # Disease risk
            if 'disease_risk' in prediction_data:
                risk = prediction_data['disease_risk']['overall_risk']
                if risk == 'HIGH':
                    message += "Warning: High risk of crop disease. Check your crops carefully and take preventive measures. "
                elif risk == 'MEDIUM':
                    message += "There is some risk of disease. Monitor your crops regularly. "
            
            # Pest risk
            if 'pest_risk' in prediction_data:
                risk = prediction_data['pest_risk']['overall_risk']
                if risk == 'HIGH':
                    message += "Warning: High risk of pests. Inspect your crops for insects. "
            
            return message
        
        elif language == 'hi':
            message = "Yeh rahe aapke sujhav. "
            
            irrigation = prediction_data.get('irrigation_liters', 0)
            if irrigation > 500:
                message += f"{int(irrigation)} litre paani dena zaroori hai. "
            elif irrigation > 200:
                message += f"{int(irrigation)} litre paani dein. "
            else:
                message += f"{int(irrigation)} litre paani kaafi hai. "
            
            n = prediction_data.get('fertilizer_N_g', 0)
            p = prediction_data.get('fertilizer_P_g', 0)
            k = prediction_data.get('fertilizer_K_g', 0)
            
            if n > 100 or p > 50 or k > 80:
                message += f"Khad dalen: {int(n)} gram nitrogen, {int(p)} gram phosphorus, {int(k)} gram potassium. "
            
            if 'disease_risk' in prediction_data:
                risk = prediction_data['disease_risk']['overall_risk']
                if risk == 'HIGH':
                    message += "Chetavni: Fasal mein bimari ka zyada khatra. Dhyan se dekhen aur bachav karein. "
                elif risk == 'MEDIUM':
                    message += "Thodi bimari ka khatra hai. Fasal ko niyamit dekhen. "
            
            return message
        
        return "Prediction data processed."
