import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

/**
 * SIMPLIFIED DASHBOARD
 * 
 * Uses static sensor data and external APIs for weather and soil information
 */

const ModernDashboard = () => {
  const { t, language, cycleLanguage } = useLanguage();
  const { user } = useAuth();
  
  const [predictions, setPredictions] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // All sensor data comes from APIs only
  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    weatherCondition: null,
    soilMoisture: null,
    soilTemperature: null,
    nitrogen: null,
    phosphorus: null,
    potassium: null,
    soilType: null
  });

  // Text-to-speech function
  const speakText = (text) => {
    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-US';
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Generate speech text from predictions
  const generateSpeechFromPredictions = (pred) => {
    if (!pred) return '';
    
    const { irrigation_liters, fertilizer_N_g, fertilizer_P_g, fertilizer_K_g } = pred;
    
    if (language === 'hi') {
      return `एआई सिफारिश तैयार है। ${irrigation_liters} लीटर पानी से सिंचाई करें। ${fertilizer_N_g} ग्राम नाइट्रोजन, ${fertilizer_P_g} ग्राम फॉस्फोरस, और ${fertilizer_K_g} ग्राम पोटेशियम उर्वरक डालें। यह आपकी फसल की अच्छी वृद्धि सुनिश्चित करेगा।`;
    } else if (language === 'mr') {
      return `एआय शिफारस तयार आहे। ${irrigation_liters} लिटर पाण्याने सिंचन करा। ${fertilizer_N_g} ग्राम नायट्रोजन, ${fertilizer_P_g} ग्राम फॉस्फरस, आणि ${fertilizer_K_g} ग्राम पोटॅशियम खत घाला। हे तुमच्या पिकाची चांगली वाढ सुनिश्चित करेल।`;
    } else {
      return `AI recommendation ready. Apply ${irrigation_liters} liters of water for irrigation. Apply ${fertilizer_N_g} grams of Nitrogen, ${fertilizer_P_g} grams of Phosphorus, and ${fertilizer_K_g} grams of Potassium fertilizer. This will ensure good crop growth.`;
    }
  };

  // Translation helper for AI explanations
  const translateExplanation = (text, lang) => {
    if (lang === 'en') return text;
    
    const translations = {
      hi: {
        'Minimal irrigation': 'न्यूनतम सिंचाई',
        'Moderate irrigation': 'मध्यम सिंचाई',
        'High irrigation': 'अधिक सिंचाई',
        'required': 'आवश्यक',
        'recommended': 'अनुशंसित',
        'soil moisture adequate': 'मिट्टी की नमी पर्याप्त',
        'soil moisture low': 'मिट्टी की नमी कम',
        'Fertilizer': 'उर्वरक',
        'supplement needed': 'पूरक आवश्यक',
        'current': 'वर्तमान',
        'Plant stress detected': 'पौधे में तनाव का पता चला',
        'increased care recommended': 'बढ़ी हुई देखभाल अनुशंसित',
        'Excellent leaf health': 'उत्कृष्ट पत्ती स्वास्थ्य',
        'Good leaf health': 'अच्छा पत्ती स्वास्थ्य',
        'to maintain optimal moisture': 'इष्टतम नमी बनाए रखने के लिए',
        'level': 'स्तर'
      },
      mr: {
        'Minimal irrigation': 'किमान सिंचन',
        'Moderate irrigation': 'मध्यम सिंचन',
        'High irrigation': 'जास्त सिंचन',
        'required': 'आवश्यक',
        'recommended': 'शिफारस केलेले',
        'soil moisture adequate': 'मातीची नमी पुरेशी',
        'soil moisture low': 'मातीची नमी कमी',
        'Fertilizer': 'खत',
        'supplement needed': 'पूरक आवश्यक',
        'current': 'सध्या',
        'Plant stress detected': 'वनस्पतीमध्ये ताण आढळला',
        'increased care recommended': 'वाढीव काळजी शिफारस',
        'Excellent leaf health': 'उत्कृष्ट पान आरोग्य',
        'Good leaf health': 'चांगले पान आरोग्य',
        'to maintain optimal moisture': 'इष्टतम नमी राखण्यासाठी',
        'level': 'पातळी'
      }
    };
    
    let translated = text;
    const langMap = translations[lang];
    
    if (langMap) {
      Object.entries(langMap).forEach(([english, local]) => {
        const regex = new RegExp(english, 'gi');
        translated = translated.replace(regex, local);
      });
    }
    
    return translated;
  };

  // Extract zone info (soil type, crop, region)
  const getZoneInfo = (zoneId) => {
    const label = getZoneLabel(zoneId);
    const parts = label.split(' - ');
    if (parts.length >= 2) {
      const soilType = parts[0].replace(/[🌾🌿🌱🌰🥥🍬🍌🍉]/g, '').trim();
      const cropAndRegion = parts[1];
      const regionMatch = cropAndRegion.match(/\(([^)]+)\)/);
      const crop = cropAndRegion.replace(/\([^)]+\)/, '').trim();
      const region = regionMatch ? regionMatch[1] : 'महाराष्ट्र';
      return { soilType, crop, region, fullLabel: label };
    }
    return { soilType: 'Unknown', crop: 'Unknown', region: 'महाराष्ट्र', fullLabel: label };
  };

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather data from WeatherAPI.com
  const fetchWeatherData = async () => {
    try {
      console.log('🌤️ Fetching weather data...');
      const response = await farmAPI.getWeatherData('mumbai');
      console.log('✅ Weather data received:', response);
      
      // Check if using backend proxy (response.data) or direct API (response.current)
      const weatherData = response.data || response;
      const data = weatherData.data || weatherData.current || weatherData;
      
      if (data && (data.temperature !== undefined || data.temp_c !== undefined)) {
        setSensorData(prev => ({
          ...prev,
          temperature: data.temperature || data.temp_c,
          humidity: data.humidity,
          weatherCondition: data.condition || (data.condition && data.condition.text)
        }));
        console.log('🌡️ Temperature:', data.temperature || data.temp_c, '°C');
        console.log('💧 Humidity:', data.humidity, '%');
        console.log('🌤️ Condition:', data.condition || (data.condition && data.condition.text));
      }
    } catch (error) {
      console.error('❌ Error fetching weather data:', error);
    }
  };

  // Fetch soil data from AgroMonitoring API
  const fetchSoilData = async () => {
    try {
      console.log('🌱 Fetching soil data...');
      
      // Direct API call to avoid CORS issues
      const response = await fetch(
        `https://api.agromonitoring.com/agro/1.0/soil?lat=19.0760&lon=72.8777&appid=97f32bc1c704c19fbb76c734b0c127b6`
      );
      const data = await response.json();
      
      console.log('✅ Soil API response:', data);
      
      if (data) {
        const updates = {};
        
        // Soil moisture from API (in decimal, convert to percentage)
        if (data.moisture !== undefined) {
          updates.soilMoisture = Math.round(data.moisture * 100);
          console.log('💧 Soil moisture:', updates.soilMoisture, '%');
        }
        
        // Soil temperature from API (in Kelvin, convert to Celsius)
        // Use t10 (10cm depth) or t0 (surface)
        if (data.t10 !== undefined) {
          updates.soilTemperature = (data.t10 - 273.15).toFixed(1);
          console.log('🌡️ Soil temperature (10cm):', updates.soilTemperature, '°C');
        } else if (data.t0 !== undefined) {
          updates.soilTemperature = (data.t0 - 273.15).toFixed(1);
          console.log('🌡️ Soil temperature (surface):', updates.soilTemperature, '°C');
        }
        
        if (Object.keys(updates).length > 0) {
          setSensorData(prev => ({ ...prev, ...updates }));
        }
      }
    } catch (error) {
      console.error('❌ Error fetching soil data:', error);
      // Set fallback values
      setSensorData(prev => ({ 
        ...prev, 
        soilMoisture: prev.soilMoisture || 62,
        soilTemperature: prev.soilTemperature || '18.8'
      }));
    }
  };

  // Fetch NPK data from Agriculture API
  const fetchNPKData = async () => {
    try {
      console.log('🧪 Fetching NPK data...');
      const response = await farmAPI.getNPKData();
      console.log('✅ NPK data received:', JSON.stringify(response, null, 2));
      
      // getNPKData already returns the data object directly
      const data = response || {};
      
      // Update sensor data with NPK values and soil type
      if (data && (data.nitrogen !== undefined || data.phosphorus !== undefined || data.potassium !== undefined)) {
        // Check multiple possible locations for soil type
        let soilType = data.soil_type || 
                      data.soilType || 
                      data.soil_name ||
                      data.soilName ||
                      (data.data && data.data.soil_type) ||
                      (data.data && data.data.soilType) ||
                      null;
        
        console.log('🔍 All data keys:', Object.keys(data));
        console.log('🏜️ Extracted Soil Type:', soilType);
        
        setSensorData(prev => ({
          ...prev,
          nitrogen: data.nitrogen || data.n || data.N,
          phosphorus: data.phosphorus || data.p || data.P,
          potassium: data.potassium || data.k || data.K,
          soilType: soilType
        }));
        console.log('🧪 Nitrogen:', data.nitrogen, 'kg/ha');
        console.log('🧪 Phosphorus:', data.phosphorus, 'kg/ha');
        console.log('🧪 Potassium:', data.potassium, 'kg/ha');
        console.log('🏜️ Final Soil Type:', soilType);
      }
    } catch (error) {
      console.error('❌ Error fetching NPK data:', error);
    }
  };

  useEffect(() => {
    // Fetch weather and soil data on component mount
    fetchWeatherData();
    fetchSoilData();
    fetchNPKData();
  }, []);

  const formatTime = (date) => {
    const locale = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
    return date.toLocaleString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getRecommendations = async () => {
    setLoading(true);
    try {
      // Check if API data has loaded
      if (!sensorData.temperature || !sensorData.humidity) {
        alert('⏳ Please wait for sensor data to load...');
        setLoading(false);
        return;
      }

      // Ensure all values are numbers
      const requestData = {
        zone_id: 'ZONE001',  // Default zone for compatibility with deployed backend
        temperature: parseFloat(sensorData.temperature) || 25.0,
        humidity: parseFloat(sensorData.humidity) || 60.0,
        soil_moisture: parseFloat(sensorData.soilMoisture) || 45.0,
        soil_temp: parseFloat(sensorData.soilTemperature || sensorData.temperature) || 25.0,
        nitrogen: parseFloat(sensorData.nitrogen) || 120.0,
        phosphorus: parseFloat(sensorData.phosphorus) || 85.0,
        potassium: parseFloat(sensorData.potassium) || 95.0,
        soil_type: sensorData.soilType || 'black_soil'
      };

      console.log('📤 Sending prediction request:', requestData);
      const response = await farmAPI.predictWithData(requestData);
      console.log('📥 Received prediction response:', response.data);

      if (response.data && response.data.data) {
        const pred = response.data.data;
        
        // Update predictions with crop recommendation
        setPredictions({
          crop: pred.predicted_crop,
          confidence: pred.confidence,
          confidence_percent: pred.predictions?.confidence || (pred.confidence * 100).toFixed(2) + '%',
          top_3_crops: pred.top_3_crops || [],
          explanation: pred.explanation,
          season: pred.season,
          alternatives: pred.predictions?.alternatives || []
        });
        
        // Speak the crop recommendation
        const speechText = language === 'hi' 
          ? `कृत्रिम बुद्धिमत्ता सिफारिश तैयार है। वर्तमान मौसम ${pred.season} है। आप ${pred.predicted_crop} की खेती कर सकते हैं। विश्वास स्तर ${pred.predictions?.confidence || (pred.confidence * 100).toFixed(0) + ' प्रतिशत'} है।`
          : language === 'mr'
          ? `कृत्रिम बुद्धिमत्ता शिफारस तयार आहे। सध्याचा हंगाम ${pred.season} आहे। तुम्ही ${pred.predicted_crop} ची लागवड करू शकता। विश्वास पातळी ${pred.predictions?.confidence || (pred.confidence * 100).toFixed(0) + ' टक्के'} आहे।`
          : `AI recommendation ready. Current season is ${pred.season}. You can grow ${pred.predicted_crop}. Confidence level is ${pred.predictions?.confidence || (pred.confidence * 100).toFixed(0) + ' percent'}.`;
        
        speakText(speechText);
      }
    } catch (error) {
      console.error('❌ Prediction Error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get recommendations';
      alert(`❌ Error: ${errorMessage}\n\nPlease try again.`);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toFixed(decimals);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 pt-16 lg:pt-0">
      {/* Farmer-friendly Background Pattern */
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(120, 80, 40, 0.1) 35px, rgba(120, 80, 40, 0.1) 70px)`
        }}></div>
      </div>

      <div className="relative w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Time Display */}
        <div className="text-center mb-6 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-md">
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-lg font-semibold text-amber-900">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <img src="/pwa-192x192.png" alt="FarmAI" className="w-16 h-16 object-contain" />
              <h1 className="text-4xl md:text-5xl font-black text-amber-900">
                {language === 'hi' ? 'फार्म डैशबोर्ड' : language === 'mr' ? 'शेत डॅशबोर्ड' : 'Farm Dashboard'}
              </h1>
            </div>
            <p className="text-base md:text-lg text-amber-700 font-medium">
              {language === 'hi' ? 'एआई-संचालित खेती सहायक' : language === 'mr' ? 'एआय-चालित शेती सहाय्यक' : 'AI-Powered Farming Assistant'}
            </p>
          </div>
        </div>

        {/* AI Recommendations Button */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4">
                <button
                  onClick={getRecommendations}
                  disabled={loading}
                  className="group relative px-10 py-5 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {language === 'hi' ? 'प्रसंस्करण...' : language === 'mr' ? 'प्रक्रिया करत आहे...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                        </svg>
                        {language === 'hi' ? 'एआई सिफारिश प्राप्त करें' : language === 'mr' ? 'एआय शिफारस मिळवा' : 'Get AI Recommendations'}
                      </>
                    )}
                  </span>
                </button>
                
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                    {language === 'hi' ? 'रोकें' : language === 'mr' ? 'थांबवा' : 'Stop'}
                  </button>
                )}
          </div>
        </div>

        {/* Predictions */}
        {predictions && predictions.crop && (
              <>
                {/* Soil Type Display */}
                <div className="mb-8 max-w-lg mx-auto">
                  <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-3xl p-8 shadow-2xl border-2 border-amber-300/50">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-300/10 rounded-full -ml-12 -mb-12"></div>
                    <div className="relative flex items-center justify-center gap-4">
                      <div className="text-5xl animate-pulse">🏜️</div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-amber-700/80 mb-2 uppercase tracking-wider">
                          {language === 'hi' ? 'मिट्टी का प्रकार' : language === 'mr' ? 'मातीचा प्रकार' : 'Soil Type'}
                        </p>
                        <p className="text-3xl font-black text-amber-900 uppercase tracking-wide">
                          {sensorData.soilType ? sensorData.soilType.replace(/_/g, ' ') : 'Black Soil'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Crop Recommendation Banner */}
                <div className="mb-8 relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24"></div>
                  <div className="relative flex items-center justify-between flex-wrap gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-3xl font-black mb-1">
                          {language === 'hi' ? '🌾 अनुशंसित फसल' : language === 'mr' ? '🌾 शिफारस केलेले पीक' : '🌾 Recommended Crop'}
                        </h3>
                        <p className="text-white/95 text-base font-semibold">
                          {language === 'hi' ? `मौसम: ${predictions.season}` : language === 'mr' ? `हंगाम: ${predictions.season}` : `Season: ${predictions.season}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4">
                      <div className="text-5xl font-black uppercase tracking-wider mb-2">{predictions.crop}</div>
                      <div className="text-white/95 text-base">
                        {language === 'hi' ? 'विश्वास:' : language === 'mr' ? 'विश्वास:' : 'Confidence:'} <span className="font-black text-lg">{predictions.confidence_percent}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top 3 Alternative Crops */}
                {predictions.top_3_crops && predictions.top_3_crops.length > 0 && (
                  <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200 shadow-md">
                    <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                      <span>🏆</span>
                      {language === 'hi' ? 'शीर्ष 3 फसल विकल्प' : language === 'mr' ? 'शीर्ष 3 पीक पर्याय' : 'Top 3 Crop Options'}
                    </h4>
                    <div className="space-y-3">
                      {predictions.top_3_crops.map((crop, index) => (
                        <div key={index} className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                          index === 0 ? 'bg-green-50 border-green-300' : 
                          index === 1 ? 'bg-blue-50 border-blue-300' : 
                          'bg-amber-50 border-amber-300'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-green-600' : 
                              index === 1 ? 'bg-blue-600' : 
                              'bg-amber-600'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-lg font-bold text-gray-800 uppercase">{crop.crop}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{crop.confidence_percent}</div>
                            <div className="text-xs text-gray-600">
                              {language === 'hi' ? 'संभावना' : language === 'mr' ? 'शक्यता' : 'Probability'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation Section */}
                {predictions.explanation && (
                  <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-md">
                    <div className="flex items-start gap-4">
                      <svg className="w-10 h-10 text-amber-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                      <div>
                        <h4 className="text-lg font-bold text-amber-900 mb-2">
                          {language === 'hi' ? 'एआई व्याख्या' : language === 'mr' ? 'एआय स्पष्टीकरण' : 'AI Explanation'}
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{predictions.explanation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
      </div>
    </div>
  );
};

export default ModernDashboard;
