import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api/api';
import { useLanguage } from '../context/LanguageContext';
import { useZones } from '../hooks/useZones';
import { useLatestData } from '../hooks/useLatestData';
import { savePendingAction } from '../offline/db';

/**
 * OFFLINE-FIRST DASHBOARD
 * 
 * This component uses custom hooks that implement offline-first data fetching:
 * - useZones() → Loads zones from API if online, else from IndexedDB cache
 * - useLatestData() → Loads current sensor data with automatic fallback to cache
 * 
 * When offline, all data is served from IndexedDB. When connection returns,
 * data is automatically refreshed from the API.
 */

const ModernDashboard = () => {
  const { t, getZoneLabel, language } = useLanguage();
  
  // OFFLINE-FIRST: Use custom hooks instead of manual API calls
  const { zones, loading: zonesLoading, error: zonesError, source: zonesSource } = useZones();
  
  const [selectedZone, setSelectedZone] = useState('');
  const [predictions, setPredictions] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSpeaking, setIsSpeaking] = useState(false);

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

  // OFFLINE-FIRST: Load latest data for selected zone
  const {
    data: currentData,
    loading: dataLoading,
    error: dataError,
    source: dataSource,
    refresh: refreshData,
  } = useLatestData(selectedZone);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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

  // OFFLINE-FIRST: Zone selection now just updates state, data loads automatically via hook
  const handleZoneChange = (zone) => {
    setSelectedZone(zone);
    setPredictions(null);
    // No need to manually fetch - useLatestData hook handles it automatically
  };

  const getRecommendations = async () => {
    if (!selectedZone) {
      alert('🌾 Please select a farm zone first!');
      return;
    }

    setLoading(true);
    try {
      // Use the same /api/predict endpoint as Recommendations page for actual model values
      const response = await farmAPI.predict(selectedZone);
      const data = response.data;
      
      if (data.success) {
        const pred = data.prediction;
        setPredictions(pred.predictions);
        setModelInfo({
          model_used: pred.model_used,
          explanation: pred.explanation,
          input_summary: pred.input_summary
        });
        // Speak the recommendations
        const speechText = generateSpeechFromPredictions(pred.predictions);
        if (speechText) {
          speakText(speechText);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to get recommendations. Please try again.');
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
      {/* Farmer-friendly Background Pattern */}
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
                {t.dashboard.title}</h1>
            </div>
            <p className="text-base md:text-lg text-amber-700 font-medium">{t.dashboard.subtitle}</p>
          </div>
        </div>

        {/* Zone Selection Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 p-6 mb-6">
          <label className="block text-lg font-semibold text-amber-900 mb-3">{t.dashboard.selectZone}</label>
          <select
            value={selectedZone}
            onChange={(e) => handleZoneChange(e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white text-amber-900 font-medium"
          >
            <option value="">{t.dashboard.chooseZone}</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>{getZoneLabel(zone)}</option>
            ))}
          </select>
        </div>

        {/* Farm & Soil Information */}
        {selectedZone && currentData && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg border-2 border-amber-300 p-6 mb-6">
            <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🏡</span> {language === 'hi' ? 'खेत और मिट्टी की जानकारी' : language === 'mr' ? 'शेत आणि मातीची माहिती' : 'Farm & Soil Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Soil Information */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 shadow-md border border-amber-200">
                <p className="text-base font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">🌱</span> {language === 'hi' ? 'मिट्टी की जानकारी' : language === 'mr' ? 'मातीची माहिती' : 'Soil Information'}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-28">{language === 'hi' ? 'प्रकार:' : language === 'mr' ? 'प्रकार:' : 'Type:'}</span>
                    <span className="text-base font-semibold text-gray-800">{getZoneInfo(selectedZone).soilType}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-28">{language === 'hi' ? 'फसल:' : language === 'mr' ? 'पिक:' : 'Crop:'}</span>
                    <span className="text-base font-semibold text-gray-800">{getZoneInfo(selectedZone).crop}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-28">{language === 'hi' ? 'क्षेत्र:' : language === 'mr' ? 'प्रदेश:' : 'Region:'}</span>
                    <span className="text-base font-semibold text-gray-800">{getZoneInfo(selectedZone).region}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-28">{language === 'hi' ? 'जोन आईडी:' : language === 'mr' ? 'झोन आयडी:' : 'Zone ID:'}</span>
                    <span className="text-sm font-mono font-semibold text-primary-600">{selectedZone}</span>
                  </div>
                </div>
              </div>
              
              {/* Farm Information */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-5 shadow-md border border-amber-200">
                <p className="text-base font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span className="text-xl">🚜</span> {language === 'hi' ? 'खेत की जानकारी' : language === 'mr' ? 'शेताची माहिती' : 'Farm Information'}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-28">{language === 'hi' ? 'आकार:' : language === 'mr' ? 'आकार:' : 'Size:'}</span>
                    <span className="text-base font-semibold text-gray-800">1 {language === 'hi' ? 'एकड़' : language === 'mr' ? 'एकर' : 'Acre'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-28">{language === 'hi' ? 'क्षेत्रफल:' : language === 'mr' ? 'क्षेत्रफळ:' : 'Area:'}</span>
                    <span className="text-base font-semibold text-gray-800">4,047 m²</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-28">{language === 'hi' ? 'स्थान:' : language === 'mr' ? 'स्थान:' : 'Location:'}</span>
                    <span className="text-base font-semibold text-gray-800">{language === 'hi' ? 'महाराष्ट्र, भारत' : language === 'mr' ? 'महाराष्ट्र, भारत' : 'Maharashtra, India'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 w-28">{language === 'hi' ? 'स्थिति:' : language === 'mr' ? 'स्थिती:' : 'Status:'}</span>
                    <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      {language === 'hi' ? 'सक्रिय निगरानी' : language === 'mr' ? 'सक्रिय निरीक्षण' : 'Active Monitoring'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentData && (
          <>
            {/* Current Conditions */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-amber-900">
                {t.dashboard.liveConditions}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Temperature */}
                <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">{t.dashboard.temperature}</p>
                  <p className="text-3xl font-bold text-amber-900">
                    {formatNumber(currentData.sensor?.temperature, 1)}°C
                  </p>
                </div>

                {/* Humidity */}
                <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v9A2.5 2.5 0 005.5 17h9a2.5 2.5 0 002.5-2.5v-9A2.5 2.5 0 0014.5 3h-9zM5 5.5A.5.5 0 015.5 5h9a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-blue-800 mb-1">{t.dashboard.humidity}</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatNumber(currentData.sensor?.humidity, 0)}%
                  </p>
                  <div className="mt-3 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                      style={{ width: `${currentData.sensor?.humidity || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Soil Moisture */}
                <div className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-green-800 mb-1">{t.dashboard.soilMoisture}</p>
                  <p className="text-3xl font-bold text-green-900">
                    {formatNumber(currentData.sensor?.soil_moisture, 0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* NPK Nutrients */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-amber-900 mb-4 flex items-center justify-center gap-2">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {t.dashboard.soilNutrients}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-purple-700">N</span>
                    </div>
                    <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">{t.dashboard.nitrogen}</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{formatNumber(currentData.sensor?.nitrogen, 2)}</p>
                  <p className="text-xs text-purple-600 mt-1">mg/kg</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-orange-700">P</span>
                    </div>
                    <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-3 py-1 rounded-full">{t.dashboard.phosphorus}</span>
                  </div>
                  <p className="text-3xl font-bold text-orange-900">{formatNumber(currentData.sensor?.phosphorus, 2)}</p>
                  <p className="text-xs text-orange-600 mt-1">mg/kg</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-md hover:shadow-lg transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-pink-700">K</span>
                    </div>
                    <span className="text-xs font-semibold text-pink-700 bg-pink-100 px-3 py-1 rounded-full">{t.dashboard.potassium}</span>
                  </div>
                  <p className="text-3xl font-bold text-pink-900">{formatNumber(currentData.sensor?.potassium, 2)}</p>
                  <p className="text-xs text-pink-600 mt-1">mg/kg</p>
                </div>
              </div>
            </div>

            {/* AI Recommendations Button */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={getRecommendations}
                  disabled={loading}
                  className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {t.dashboard.processingMagic}
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                        </svg>
                        {t.dashboard.getAIRecommendations}
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
            {predictions && (
              <>
                {/* Model Info Banner */}
                {modelInfo && (
                  <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-md">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <svg className="w-10 h-10 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                        </svg>
                        <div>
                          <h3 className="text-lg font-bold text-amber-900">{t.dashboard.aiRecommendation}</h3>
                          <p className="text-sm text-amber-700">{t.dashboard.poweredByML}</p>
                        </div>
                      </div>
                      <span className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-md">
                        {modelInfo.model_used}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v9A2.5 2.5 0 005.5 17h9a2.5 2.5 0 002.5-2.5v-9A2.5 2.5 0 0014.5 3h-9zM5 5.5A.5.5 0 015.5 5h9a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900">{t.dashboard.waterNeeded}</h3>
                        <p className="text-sm text-blue-700">{t.dashboard.irrigationRecommendation}</p>
                      </div>
                    </div>
                    <p className="text-5xl font-bold text-blue-900 mb-2">
                      {formatNumber(predictions.irrigation_liters, 0)}
                    </p>
                    <p className="text-lg text-blue-700 font-semibold">{t.dashboard.liters}</p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-900">{t.dashboard.fertilizerMix}</h3>
                        <p className="text-sm text-green-700">{t.dashboard.npkRecommendation}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <span className="font-semibold text-purple-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-purple-600 rounded text-white text-sm flex items-center justify-center">N</span>
                          Nitrogen
                        </span>
                        <span className="text-2xl font-bold text-purple-900">{formatNumber(predictions.fertilizer_N_g, 0)}g</span>
                      </div>
                      <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <span className="font-semibold text-orange-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-orange-600 rounded text-white text-sm flex items-center justify-center">P</span>
                          Phosphorus
                        </span>
                        <span className="text-2xl font-bold text-orange-900">{formatNumber(predictions.fertilizer_P_g, 0)}g</span>
                      </div>
                      <div className="flex items-center justify-between bg-pink-50 rounded-lg p-3 border border-pink-200">
                        <span className="font-semibold text-pink-700 flex items-center gap-2">
                          <span className="w-6 h-6 bg-pink-600 rounded text-white text-sm flex items-center justify-center">K</span>
                          Potassium
                        </span>
                        <span className="text-2xl font-bold text-pink-900">{formatNumber(predictions.fertilizer_K_g, 0)}g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanation Section */}
                {modelInfo && modelInfo.explanation && (
                  <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-md">
                    <div className="flex items-start gap-4">
                      <svg className="w-10 h-10 text-amber-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                      <div>
                        <h4 className="text-lg font-bold text-amber-900 mb-2">{t.dashboard.aiExplanation}</h4>
                        <p className="text-gray-700 leading-relaxed">{translateExplanation(modelInfo.explanation, language)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Input Summary */}
                {modelInfo && modelInfo.input_summary && (
                  <div className="backdrop-blur-xl bg-white/40 rounded-2xl p-6 border-2 border-gray-200/50 shadow-xl">
                    <h4 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      {t.dashboard.currentConditions}
                    </h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      <div className="bg-blue-100/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">{t.dashboard.moisture}</p>
                        <p className="text-lg font-black text-blue-700">{formatNumber(modelInfo.input_summary.soil_moisture, 1)}%</p>
                      </div>
                      <div className="bg-orange-100/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">{t.dashboard.temp}</p>
                        <p className="text-lg font-black text-orange-700">{formatNumber(modelInfo.input_summary.temperature, 1)}°C</p>
                      </div>
                      <div className="bg-cyan-100/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">{t.dashboard.rainfall}</p>
                        <p className="text-lg font-black text-cyan-700">{formatNumber(modelInfo.input_summary.rainfall, 0)}mm</p>
                      </div>
                      <div className="bg-purple-100/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">N</p>
                        <p className="text-lg font-black text-purple-700">{formatNumber(modelInfo.input_summary.nitrogen, 0)}</p>
                      </div>
                      <div className="bg-yellow-100/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">P</p>
                        <p className="text-lg font-black text-yellow-700">{formatNumber(modelInfo.input_summary.phosphorus, 1)}</p>
                      </div>
                      <div className="bg-pink-100/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-600 mb-1">K</p>
                        <p className="text-lg font-black text-pink-700">{formatNumber(modelInfo.input_summary.potassium, 1)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!selectedZone && (
          <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-16 border border-amber-200 shadow-md">
            <img src="/pwa-192x192.png" alt="FarmAI" className="w-32 h-32 mx-auto mb-6 object-contain" />
            <h2 className="text-3xl font-bold text-amber-900 mb-4">{t.dashboard.welcomeToFarmAI}</h2>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto">
              {t.dashboard.selectZonePrompt}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ModernDashboard;
