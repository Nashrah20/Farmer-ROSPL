import requests
from datetime import datetime, timedelta

class WeatherService:
    """Service to fetch weather data and forecasts"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or "demo"  # Use demo key or user's key
        self.base_url = "https://api.openweathermap.org/data/2.5"
    
    def get_current_weather(self, lat, lon):
        """Get current weather data"""
        try:
            url = f"{self.base_url}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'temperature': data['main']['temp'],
                    'humidity': data['main']['humidity'],
                    'wind_speed': data['wind']['speed'] * 3.6,  # Convert m/s to km/h
                    'description': data['weather'][0]['description'],
                    'pressure': data['main']['pressure'],
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return self._get_mock_weather()
                
        except Exception as e:
            print(f"Weather API error: {e}")
            return self._get_mock_weather()
    
    def get_forecast(self, lat, lon, days=7):
        """Get weather forecast for next N days"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric',
                'cnt': days * 8  # 8 forecasts per day (3-hour intervals)
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Group by day and calculate daily averages
                daily_forecast = []
                current_date = None
                daily_data = {
                    'temp': [],
                    'humidity': [],
                    'wind': [],
                    'rainfall': 0
                }
                
                for item in data['list']:
                    item_date = datetime.fromtimestamp(item['dt']).date()
                    
                    if current_date is None:
                        current_date = item_date
                    
                    if item_date != current_date:
                        # Save previous day's data
                        daily_forecast.append({
                            'date': current_date.isoformat(),
                            'temp': sum(daily_data['temp']) / len(daily_data['temp']),
                            'humidity': sum(daily_data['humidity']) / len(daily_data['humidity']),
                            'wind': sum(daily_data['wind']) / len(daily_data['wind']),
                            'rainfall': daily_data['rainfall'],
                            'description': item['weather'][0]['description']
                        })
                        
                        # Reset for new day
                        current_date = item_date
                        daily_data = {
                            'temp': [],
                            'humidity': [],
                            'wind': [],
                            'rainfall': 0
                        }
                    
                    daily_data['temp'].append(item['main']['temp'])
                    daily_data['humidity'].append(item['main']['humidity'])
                    daily_data['wind'].append(item['wind']['speed'] * 3.6)
                    
                    if 'rain' in item:
                        daily_data['rainfall'] += item['rain'].get('3h', 0)
                
                # Add last day if data exists
                if daily_data['temp']:
                    daily_forecast.append({
                        'date': current_date.isoformat(),
                        'temp': sum(daily_data['temp']) / len(daily_data['temp']),
                        'humidity': sum(daily_data['humidity']) / len(daily_data['humidity']),
                        'wind': sum(daily_data['wind']) / len(daily_data['wind']),
                        'rainfall': daily_data['rainfall']
                    })
                
                return daily_forecast[:days]
                
            else:
                return self._get_mock_forecast(days)
                
        except Exception as e:
            print(f"Forecast API error: {e}")
            return self._get_mock_forecast(days)
    
    def _get_mock_weather(self):
        """Return mock weather data when API is unavailable"""
        return {
            'temperature': 28,
            'humidity': 65,
            'wind_speed': 12,
            'description': 'partly cloudy',
            'pressure': 1013,
            'timestamp': datetime.now().isoformat(),
            'note': 'Mock data - API unavailable'
        }
    
    def _get_mock_forecast(self, days):
        """Return mock forecast data"""
        forecast = []
        base_temp = 28
        
        for i in range(days):
            date = datetime.now() + timedelta(days=i+1)
            forecast.append({
                'date': date.date().isoformat(),
                'temp': base_temp + (i % 3) - 1,
                'humidity': 65 + (i % 5),
                'wind': 12 + (i % 4),
                'rainfall': 0 if i % 3 != 0 else 15,
                'description': 'partly cloudy',
                'note': 'Mock data'
            })
        
        return forecast


class MarketPriceService:
    """Service to fetch market price data"""
    
    def __init__(self):
        # In production, connect to actual market price APIs
        # For now, using mock data with realistic price ranges
        self.prices = {
            'rice': {'price_per_kg': 25, 'trend': 'stable', 'last_updated': datetime.now()},
            'wheat': {'price_per_kg': 22, 'trend': 'up', 'last_updated': datetime.now()},
            'corn': {'price_per_kg': 18, 'trend': 'down', 'last_updated': datetime.now()},
            'tomato': {'price_per_kg': 35, 'trend': 'up', 'last_updated': datetime.now()},
            'potato': {'price_per_kg': 15, 'trend': 'stable', 'last_updated': datetime.now()},
            'onion': {'price_per_kg': 28, 'trend': 'up', 'last_updated': datetime.now()},
            'fertilizer_urea': {'price_per_kg': 6.5, 'trend': 'stable', 'last_updated': datetime.now()},
            'fertilizer_dap': {'price_per_kg': 7.2, 'trend': 'up', 'last_updated': datetime.now()},
        }
    
    def get_crop_price(self, crop_name):
        """Get current market price for a crop"""
        crop_name = crop_name.lower()
        
        if crop_name in self.prices:
            return {
                'crop': crop_name,
                'price_per_kg': self.prices[crop_name]['price_per_kg'],
                'trend': self.prices[crop_name]['trend'],
                'last_updated': self.prices[crop_name]['last_updated'].isoformat(),
                'source': 'Market API (Demo)'
            }
        else:
            return {
                'crop': crop_name,
                'price_per_kg': None,
                'error': 'Price data not available for this crop'
            }
    
    def get_all_prices(self):
        """Get all available market prices"""
        return {
            crop: {
                'price_per_kg': data['price_per_kg'],
                'trend': data['trend'],
                'last_updated': data['last_updated'].isoformat()
            }
            for crop, data in self.prices.items()
        }
    
    def calculate_revenue_estimate(self, crop_type, estimated_yield_kg, area_hectares=1):
        """Calculate estimated revenue from yield"""
        price_data = self.get_crop_price(crop_type)
        
        if price_data.get('price_per_kg'):
            total_yield = estimated_yield_kg * area_hectares
            revenue = total_yield * price_data['price_per_kg']
            
            return {
                'crop': crop_type,
                'area_hectares': area_hectares,
                'yield_kg': total_yield,
                'price_per_kg': price_data['price_per_kg'],
                'estimated_revenue': revenue,
                'trend': price_data['trend'],
                'currency': 'INR'
            }
        else:
            return {'error': 'Unable to calculate revenue - price data unavailable'}


class GovernmentSchemesService:
    """Service to provide information about government schemes and subsidies"""
    
    def __init__(self):
        self.schemes = [
            {
                'id': 'pm_kisan',
                'name': 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
                'description': 'Financial assistance of ₹6000 per year in 3 installments',
                'eligibility': 'All landholding farmers',
                'benefit': '₹6000/year',
                'category': 'financial_support',
                'application_link': 'https://pmkisan.gov.in/'
            },
            {
                'id': 'kisan_credit',
                'name': 'Kisan Credit Card (KCC)',
                'description': 'Short-term credit for agriculture at subsidized interest rates',
                'eligibility': 'Farmers with land records',
                'benefit': 'Low-interest loans (4% interest)',
                'category': 'credit',
                'application_link': 'Apply at nearest bank'
            },
            {
                'id': 'soil_health_card',
                'name': 'Soil Health Card Scheme',
                'description': 'Free soil testing and recommendations',
                'eligibility': 'All farmers',
                'benefit': 'Free soil analysis and nutrient recommendations',
                'category': 'technical_support',
                'application_link': 'Contact local agriculture office'
            },
            {
                'id': 'fasal_bima',
                'name': 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
                'description': 'Crop insurance against natural calamities',
                'eligibility': 'All farmers (mandatory for loan recipients)',
                'benefit': 'Comprehensive crop insurance with low premium',
                'category': 'insurance',
                'application_link': 'https://pmfby.gov.in/'
            },
            {
                'id': 'drip_subsidy',
                'name': 'Micro Irrigation Subsidy',
                'description': 'Subsidy for drip and sprinkler irrigation systems',
                'eligibility': 'Small and marginal farmers',
                'benefit': 'Up to 55% subsidy on irrigation systems',
                'category': 'infrastructure',
                'application_link': 'State agriculture department'
            },
            {
                'id': 'organic_farming',
                'name': 'Paramparagat Krishi Vikas Yojana (PKVY)',
                'description': 'Support for organic farming',
                'eligibility': 'Farmers willing to adopt organic methods',
                'benefit': '₹50,000 per hectare for 3 years',
                'category': 'organic_farming',
                'application_link': 'State agriculture department'
            },
            {
                'id': 'cold_storage',
                'name': 'Cold Storage Subsidy',
                'description': 'Subsidy for cold storage and warehousing',
                'eligibility': 'Farmer producer organizations and cooperatives',
                'benefit': 'Up to 35% subsidy',
                'category': 'infrastructure',
                'application_link': 'NABARD or state horticulture board'
            },
            {
                'id': 'agri_mechanization',
                'name': 'Sub-Mission on Agricultural Mechanization',
                'description': 'Subsidy for purchasing farm equipment',
                'eligibility': 'All farmers',
                'benefit': '40-50% subsidy on tractors, harvesters, etc.',
                'category': 'mechanization',
                'application_link': 'State agriculture department'
            }
        ]
    
    def get_all_schemes(self, category=None):
        """Get all schemes or filter by category"""
        if category:
            return [s for s in self.schemes if s['category'] == category]
        return self.schemes
    
    def get_recommended_schemes(self, farmer_profile):
        """
        Get personalized scheme recommendations based on farmer profile
        farmer_profile: {
            'land_size_hectares': float,
            'annual_income': float,
            'has_loan': bool,
            'crop_type': str,
            'interested_in_organic': bool
        }
        """
        recommended = []
        
        # PM-KISAN - for all farmers
        recommended.append(self.schemes[0])  # PM-KISAN
        
        # Small/marginal farmers (<2 hectares)
        if farmer_profile.get('land_size_hectares', 0) < 2:
            recommended.append(self.schemes[4])  # Drip irrigation subsidy
        
        # Farmers with loans or interested in loans
        if farmer_profile.get('has_loan', False) or farmer_profile.get('needs_credit', False):
            recommended.append(self.schemes[1])  # KCC
            recommended.append(self.schemes[3])  # Crop insurance
        
        # All farmers should know about soil health
        recommended.append(self.schemes[2])  # Soil Health Card
        
        # Organic farming interest
        if farmer_profile.get('interested_in_organic', False):
            recommended.append(self.schemes[5])  # PKVY
        
        # Farmers looking to modernize
        if farmer_profile.get('needs_mechanization', False):
            recommended.append(self.schemes[7])  # Mechanization
        
        return recommended
    
    def search_schemes(self, query):
        """Search schemes by keyword"""
        query = query.lower()
        results = []
        
        for scheme in self.schemes:
            if (query in scheme['name'].lower() or 
                query in scheme['description'].lower() or
                query in scheme['category'].lower()):
                results.append(scheme)
        
        return results
