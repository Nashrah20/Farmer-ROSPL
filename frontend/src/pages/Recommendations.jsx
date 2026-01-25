import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api/api';
import RecommendationCard from '../components/RecommendationCard';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// Zone display name mapping
const ZONE_LABELS = {
  'CS1': '🌾 Coarse Soil - Groundnut (NorthMaha)',
  'CS2': '🌾 Coarse Soil - Bajra (WestMaha)',
  'CS3': '🍉 Coarse Soil - Watermelon (Vidarbha)',
  'BS1': '🌿 Black Soil - Cotton (Vidarbha)',
  'BS2': '🌱 Black Soil - Soybean (WestMaha)',
  'BS3': '🌾 Black Soil - Jowar (NorthMaha)',
  'LS1': '🌰 Laterite Soil - Cashew (Konkan)',
  'LS2': '🥥 Laterite Soil - Coconut (Konkan)',
  'LS3': '🌾 Laterite Soil - Rice (Konkan)',
  'AS1': '🍬 Alluvial Soil - Sugarcane (WestMaha)',
  'AS2': '🌾 Alluvial Soil - Wheat (NorthMaha)',
  'AS3': '🍌 Alluvial Soil - Banana (WestMaha)',
  'YS1': '🌾 Yellow-Brown Soil - Rice (Konkan)',
  'YS2': '🌾 Yellow-Brown Soil - Ragi (Vidarbha)',
  'YS3': '🌾 Yellow-Brown Soil - Tur (NorthMaha)',
};

// Helper function to convert user's soil_type to prediction format
const convertSoilType = (userSoilType) => {
  const soilMap = {
    'black_soil': 'black',
    'red_soil': 'yellow-brown', // Red soil maps to yellow-brown category
    'laterite_soil': 'laterite',
    'alluvial_soil': 'alluvial',
    'saline_alkaline_soil': 'coarse' // Saline soil maps to coarse category
  };
  return soilMap[userSoilType] || 'black';
};

const Recommendations = () => {
  const { t, language, getZoneLabel } = useLanguage();
  const { user } = useAuth();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Crop selection only
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [selectedZone, setSelectedZone] = useState('CS1'); // Default zone for fetching sensor data
  
  // Sensor data from backend
  const [sensorData, setSensorData] = useState({
    temperature: '...',
    humidity: '...',
    soilMoisture: '...',
    soilTemperature: '...',
    nitrogen: '...',
    phosphorus: '...',
    potassium: '...',
    ph: '...',
    ec: '...',
    soilType: null
  });
  const [sensorLoading, setSensorLoading] = useState(true);

  // Translation function for explanation text
  const translateExplanation = (text) => {
    if (language === 'en' || !text) return text;
    
    // Generate a Hindi/Marathi summary from the numbers in prediction
    if (prediction && prediction.irrigation_liters !== undefined) {
      const { irrigation_liters, fertilizer_N_g, fertilizer_P_g, fertilizer_K_g } = prediction;
      
      if (language === 'hi') {
        return `वर्तमान मौसम और मिट्टी की स्थिति के आधार पर, हमारा एआई मॉडल निम्नलिखित सिफारिश करता है। ${irrigation_liters} लीटर पानी से सिंचाई करें। ${fertilizer_N_g} ग्राम नाइट्रोजन, ${fertilizer_P_g} ग्राम फॉस्फोरस, और ${fertilizer_K_g} ग्राम पोटेशियम उर्वरक डालें। यह आपकी फसल की वृद्धि में मदद करेगा और उत्पादन बढ़ाएगा। सुबह या शाम के समय उर्वरक का प्रयोग करें जब तापमान कम हो।`;
      } else if (language === 'mr') {
        return `सध्याच्या हवामान आणि मातीच्या स्थितीच्या आधारावर, आमचे एआय मॉडेल खालील शिफारस करते। ${irrigation_liters} लिटर पाण्याने सिंचन करा। ${fertilizer_N_g} ग्राम नायट्रोजन, ${fertilizer_P_g} ग्राम फॉस्फरस, आणि ${fertilizer_K_g} ग्राम पोटॅशियम खत घाला। हे तुमच्या पिकाच्या वाढीस मदत करेल आणि उत्पादन वाढवेल। सकाळी किंवा संध्याकाळी खत टाका जेव्हा तापमान कमी असेल।`;
      }
    }
    
    return text;
  };

  // Speech synthesis function
  const speakText = (text) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    if (!text) return;
    
    // Translate the text first
    const translatedText = translateExplanation(text);
    
    const utterance = new SpeechSynthesisUtterance(translatedText);
    
    // Set language based on current language
    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-US';
    }
    
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Extract zone info (soil type, crop, region)
  const getZoneInfo = (zoneId) => {
    const label = ZONE_LABELS[zoneId] || zoneId;
    const parts = label.split(' - ');
    if (parts.length >= 2) {
      let soilType = parts[0].replace(/[🌾🌿🌱🌰🥥🍬🍌🍉]/g, '').trim();
      const cropAndRegion = parts[1];
      const regionMatch = cropAndRegion.match(/\(([^)]+)\)/);
      let crop = cropAndRegion.replace(/\([^)]+\)/, '').trim();
      let region = regionMatch ? regionMatch[1] : 'Maharashtra';
      
      // Translate soil types
      const soilTranslations = {
        'Alluvial Soil': language === 'hi' ? 'जलोढ़ मिट्टी' : language === 'mr' ? 'जलोड माती' : 'Alluvial Soil',
        'Black Soil': language === 'hi' ? 'काली मिट्टी' : language === 'mr' ? 'काळी माती' : 'Black Soil',
        'Coarse Soil': language === 'hi' ? 'मोटी मिट्टी' : language === 'mr' ? 'जाड माती' : 'Coarse Soil',
        'Laterite Soil': language === 'hi' ? 'लैटराइट मिट्टी' : language === 'mr' ? 'लॅटराइट माती' : 'Laterite Soil',
        'Yellow-Brown Soil': language === 'hi' ? 'पीली-भूरी मिट्टी' : language === 'mr' ? 'पिवळी-तपकिरी माती' : 'Yellow-Brown Soil'
      };
      
      // Translate crops
      const cropTranslations = {
        'Sugarcane': language === 'hi' ? 'गन्ना' : language === 'mr' ? 'ऊस' : 'Sugarcane',
        'Wheat': language === 'hi' ? 'गेहूं' : language === 'mr' ? 'गहू' : 'Wheat',
        'Banana': language === 'hi' ? 'केला' : language === 'mr' ? 'केळ' : 'Banana',
        'Cotton': language === 'hi' ? 'कपास' : language === 'mr' ? 'कापूस' : 'Cotton',
        'Soybean': language === 'hi' ? 'सोयाबीन' : language === 'mr' ? 'सोयाबीन' : 'Soybean',
        'Jowar': language === 'hi' ? 'ज्वार' : language === 'mr' ? 'ज्वारी' : 'Jowar',
        'Groundnut': language === 'hi' ? 'मूंगफली' : language === 'mr' ? 'भुईमूग' : 'Groundnut',
        'Bajra': language === 'hi' ? 'बाजरा' : language === 'mr' ? 'बाजरी' : 'Bajra',
        'Watermelon': language === 'hi' ? 'तरबूज' : language === 'mr' ? 'कलिंगड' : 'Watermelon',
        'Cashew': language === 'hi' ? 'काजू' : language === 'mr' ? 'काजू' : 'Cashew',
        'Coconut': language === 'hi' ? 'नारियल' : language === 'mr' ? 'नारळ' : 'Coconut',
        'Rice': language === 'hi' ? 'चावल' : language === 'mr' ? 'तांदूळ' : 'Rice',
        'Ragi': language === 'hi' ? 'रागी' : language === 'mr' ? 'नाचणी' : 'Ragi',
        'Tur': language === 'hi' ? 'तुर' : language === 'mr' ? 'तूर' : 'Tur'
      };
      
      // Translate regions
      const regionTranslations = {
        'WestMaha': language === 'hi' ? 'पश्चिम महाराष्ट्र' : language === 'mr' ? 'पश्चिम महाराष्ट्र' : 'WestMaha',
        'NorthMaha': language === 'hi' ? 'उत्तर महाराष्ट्र' : language === 'mr' ? 'उत्तर महाराष्ट्र' : 'NorthMaha',
        'Vidarbha': language === 'hi' ? 'विदर्भ' : language === 'mr' ? 'विदर्भ' : 'Vidarbha',
        'Konkan': language === 'hi' ? 'कोंकण' : language === 'mr' ? 'कोंकण' : 'Konkan',
        'Maharashtra': language === 'hi' ? 'महाराष्ट्र' : language === 'mr' ? 'महाराष्ट्र' : 'Maharashtra'
      };
      
      soilType = soilTranslations[soilType] || soilType;
      crop = cropTranslations[crop] || crop;
      region = regionTranslations[region] || region;
      
      return { soilType, crop, region, fullLabel: label };
    }
    return { soilType: 'Unknown', crop: 'Unknown', region: 'Maharashtra', fullLabel: label };
  };

  useEffect(() => {
    fetchSensorData();
    // Refresh sensor data every 30 seconds
    const interval = setInterval(fetchSensorData, 30000);
    return () => clearInterval(interval);
  }, [selectedZone]);

  // Fetch sensor data from backend
  const fetchSensorData = async () => {
    setSensorLoading(true);
    try {
      console.log('🔍 Fetching sensor data for zone:', selectedZone);
      const response = await farmAPI.getLatest(selectedZone);
      console.log('📡 Full API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success && response.data.data) {
        const { sensor, weather } = response.data.data;
        
        console.log('🌡️ Raw Sensor readings:', sensor);
        console.log('☁️ Raw Weather readings:', weather);
        
        // Extract values with proper field names from backend
        const newSensorData = {
          temperature: sensor?.air_temp_c || weather?.air_temp_c || 25,
          humidity: sensor?.humidity_pct || weather?.humidity_pct || 60,
          soilMoisture: sensor?.soil_moisture_pct || sensor?.soil_moisture || 45,
          soilTemperature: sensor?.soil_temp_c || sensor?.soil_temp || 22,
          nitrogen: sensor?.N_mgkg || sensor?.nitrogen_mgkg || sensor?.nitrogen || 120,
          phosphorus: sensor?.P_mgkg || sensor?.phosphorus_mgkg || sensor?.phosphorus || 85,
          potassium: sensor?.K_mgkg || sensor?.potassium_mgkg || sensor?.potassium || 95,
          ph: sensor?.ph || 7.0,
          ec: sensor?.EC_ds_m || sensor?.ec || 0.4,
          soilType: null // Will be fetched from NPK API
        };
        
        console.log('✅ Extracted sensor data:', newSensorData);
        setSensorData(newSensorData);
      } else {
        console.warn('⚠️ No sensor data found, using defaults');
        setDefaultSensorData();
      }
      
      // Fetch NPK and soil type from external API
      try {
        const npkRes = await fetch('https://npk-agriculture-api.onrender.com/api/npk/latest');
        const npkData = await npkRes.json();
        console.log('🧪 NPK API full response:', JSON.stringify(npkData, null, 2));
        
        if (npkData) {
          // Check multiple possible locations for soil type
          let soilType = npkData.soil_type || 
                        npkData.soilType || 
                        npkData.soil_name ||
                        npkData.soilName ||
                        (npkData.data && npkData.data.soil_type) ||
                        (npkData.data && npkData.data.soilType) ||
                        null;
          
          console.log('🔍 Extracted soil type:', soilType);
          console.log('🔍 All NPK data keys:', Object.keys(npkData));
          
          setSensorData(prev => ({
            ...prev,
            nitrogen: npkData.nitrogen || npkData.n || npkData.N || prev.nitrogen,
            phosphorus: npkData.phosphorus || npkData.p || npkData.P || prev.phosphorus,
            potassium: npkData.potassium || npkData.k || npkData.K || prev.potassium,
            soilType: soilType
          }));
          console.log('✅ Updated with NPK data, soil type:', soilType);
        }
      } catch (npkError) {
        console.error('❌ NPK fetch error:', npkError);
      }
    } catch (error) {
      console.error('❌ Error fetching sensor data:', error);
      setDefaultSensorData();
    } finally {
      setSensorLoading(false);
    }
  };

  const setDefaultSensorData = () => {
    setSensorData({
      temperature: 25,
      humidity: 60,
      soilMoisture: 45,
      soilTemperature: 22,
      nitrogen: 120,
      phosphorus: 85,
      potassium: 95,
      ph: 7.0,
      ec: 0.4
    });
  };

  const getPrediction = async () => {
    if (sensorData.temperature === '...' || !sensorData.temperature) {
      alert('⏳ Please wait for sensor data to load...');
      return;
    }

    setLoading(true);
    try {
      console.log('📤 Sending prediction request with data:', {
        soil_moisture: sensorData.soilMoisture,
        soil_temp: sensorData.soilTemperature,
        air_temp: sensorData.temperature,
        humidity: sensorData.humidity,
        nitrogen: sensorData.nitrogen,
        phosphorus: sensorData.phosphorus,
        potassium: sensorData.potassium,
        ph: sensorData.ph,
        ec: sensorData.ec,
        soil_type: sensorData.soilType || 'black_soil',
        crop: selectedCrop
      });

      const response = await farmAPI.predictIrrigationFertilizer({
        soil_moisture: sensorData.soilMoisture,
        soil_temp: parseFloat(sensorData.soilTemperature),
        air_temp: sensorData.temperature,
        humidity: sensorData.humidity,
        wind: 5,
        rainfall: 0,
        ph: sensorData.ph,
        ec: sensorData.ec,
        nitrogen: sensorData.nitrogen,
        phosphorus: sensorData.phosphorus,
        potassium: sensorData.potassium,
        ndvi: 0.6,
        leaf_health: 85,
        stress_level: 5,
        soil_type: sensorData.soilType || 'black_soil',
        crop: selectedCrop,
        crop_stage: 'Growing',
        region: 'WestMaha'
      });
      
      console.log('📥 Backend response:', response.data);
      
      if (response.data.success) {
        const backendData = response.data.data;
        
        console.log('🔍 Backend irrigation data:', backendData.irrigation);
        console.log('🔍 Backend fertilizer data:', backendData.fertilizer);
        
        // Transform backend response to match frontend structure
        const transformedPrediction = {
          irrigation_liters: backendData.irrigation?.amount_liters || backendData.irrigation_liters || 15,
          fertilizer_N_g: backendData.fertilizer?.nitrogen_g || backendData.nitrogen_g || backendData.fertilizer_N_g || 75,
          fertilizer_P_g: backendData.fertilizer?.phosphorus_g || backendData.phosphorus_g || backendData.fertilizer_P_g || 40,
          fertilizer_K_g: backendData.fertilizer?.potassium_g || backendData.potassium_g || backendData.fertilizer_K_g || 50,
          explanation: backendData.irrigation?.recommendation || backendData.explanation || 'AI-based irrigation and fertilizer recommendation',
          model_used: 'Irrigation & Fertilizer Model',
          predicted_at: backendData.timestamp || new Date().toISOString(),
          input_summary: {
            soil_moisture: sensorData.soilMoisture,
            temperature: sensorData.temperature,
            rainfall: 0,
            nitrogen: sensorData.nitrogen,
            phosphorus: sensorData.phosphorus,
            potassium: sensorData.potassium
          },
          recommendations: backendData.recommendations || []
        };
        
        console.log('✅ Transformed prediction:', transformedPrediction);
        setPrediction(transformedPrediction);
        
        // Speak the recommendation after receiving it
        const explanationText = `Irrigation: ${transformedPrediction.irrigation_liters} liters. Nitrogen: ${transformedPrediction.fertilizer_N_g} grams. Phosphorus: ${transformedPrediction.fertilizer_P_g} grams. Potassium: ${transformedPrediction.fertilizer_K_g} grams.`;
        speakText(explanationText);
      } else {
        alert('Failed to get recommendation: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error getting prediction:', error);
      alert('Failed to get recommendation. Please ensure the backend model is trained.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!prediction) return;

    try {
      await farmAPI.saveAction({
        zone_id: `${sensorData.soilType || 'unknown'}_${selectedCrop}`,
        timestamp: new Date().toISOString(),
        irrigation_liters: prediction.irrigation_liters,
        fertilizer_N_g: prediction.fertilizer_N_g,
        fertilizer_P_g: prediction.fertilizer_P_g,
        fertilizer_K_g: prediction.fertilizer_K_g,
        model_used: 'irrigation_fertilizer_model',
        explanation: prediction.explanation || 'AI-based recommendation'
      });
      alert('✓ Action approved and saved!');
    } catch (error) {
      console.error('Error saving action:', error);
      alert('Failed to save action');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 pt-16 lg:pt-0">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-amber-900 mb-2 flex items-center gap-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            {t.recommendations.title}
          </h1>
          <p className="text-amber-700">{t.recommendations.subtitle}</p>
        </div>

        {/* Get Recommendations Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 p-6 mb-6">
          {/* Crop Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-amber-900 mb-2">
              🌾 {language === 'hi' ? 'फसल' : language === 'mr' ? 'पीक' : 'Crop'}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-base"
            >
                <option value="wheat">{language === 'hi' ? 'गेहूं' : language === 'mr' ? 'गहू' : 'Wheat'}</option>
                <option value="rice">{language === 'hi' ? 'चावल' : language === 'mr' ? 'तांदूळ' : 'Rice'}</option>
                <option value="cotton">{language === 'hi' ? 'कपास' : language === 'mr' ? 'कापूस' : 'Cotton'}</option>
                <option value="sugarcane">{language === 'hi' ? 'गन्ना' : language === 'mr' ? 'ऊस' : 'Sugarcane'}</option>
                <option value="soybean">{language === 'hi' ? 'सोयाबीन' : language === 'mr' ? 'सोयाबीन' : 'Soybean'}</option>
                <option value="jowar">{language === 'hi' ? 'ज्वार' : language === 'mr' ? 'ज्वारी' : 'Jowar'}</option>
                <option value="bajra">{language === 'hi' ? 'बाजरा' : language === 'mr' ? 'बाजरी' : 'Bajra'}</option>
                <option value="groundnut">{language === 'hi' ? 'मूंगफली' : language === 'mr' ? 'भुईमूग' : 'Groundnut'}</option>
                <option value="tur">{language === 'hi' ? 'तुर' : language === 'mr' ? 'तूर' : 'Tur'}</option>
                <option value="banana">{language === 'hi' ? 'केला' : language === 'mr' ? 'केळ' : 'Banana'}</option>
                <option value="watermelon">{language === 'hi' ? 'तरबूज' : language === 'mr' ? 'कलिंगड' : 'Watermelon'}</option>
                <option value="coconut">{language === 'hi' ? 'नारियल' : language === 'mr' ? 'नारळ' : 'Coconut'}</option>
                <option value="cashew">{language === 'hi' ? 'काजू' : language === 'mr' ? 'काजू' : 'Cashew'}</option>
                <option value="ragi">{language === 'hi' ? 'रागी' : language === 'mr' ? 'नाचणी' : 'Ragi'}</option>
              </select>
          </div>

          {/* Current Sensor Data Display */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-lg">📊</span>
                {language === 'hi' ? 'वर्तमान सेंसर डेटा (लाइव)' : language === 'mr' ? 'सद्य सेन्सर डेटा (लाइव्ह)' : 'Current Sensor Data (Live)'}
              </p>
              {sensorLoading && (
                <span className="text-xs text-blue-600 animate-pulse">
                  🔄 {language === 'hi' ? 'अपडेट हो रहा है...' : language === 'mr' ? 'अपडेट होत आहे...' : 'Updating...'}
                </span>
              )}
              {!sensorLoading && (
                <button 
                  onClick={fetchSensorData}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  🔄 {language === 'hi' ? 'रीफ्रेश' : language === 'mr' ? 'रीफ्रेश' : 'Refresh'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-white rounded p-2 shadow-sm">
                <span className="text-gray-600">{language === 'hi' ? '🌡️ तापमान:' : language === 'mr' ? '🌡️ तापमान:' : '🌡️ Temp:'}</span>{' '}
                <span className="font-semibold text-blue-600">
                  {sensorData.temperature !== '...' ? `${sensorData.temperature}°C` : '...'}
                </span>
              </div>
              <div className="bg-white rounded p-2 shadow-sm">
                <span className="text-gray-600">{language === 'hi' ? '💧 नमी:' : language === 'mr' ? '💧 नमी:' : '💧 Humidity:'}</span>{' '}
                <span className="font-semibold text-blue-600">
                  {sensorData.humidity !== '...' ? `${sensorData.humidity}%` : '...'}
                </span>
              </div>
              <div className="bg-white rounded p-2 shadow-sm">
                <span className="text-gray-600">{language === 'hi' ? '🌊 मिट्टी नमी:' : language === 'mr' ? '🌊 माती नमी:' : '🌊 Soil:'}</span>{' '}
                <span className="font-semibold text-green-600">
                  {sensorData.soilMoisture !== '...' ? `${sensorData.soilMoisture}%` : '...'}
                </span>
              </div>
              <div className="bg-white rounded p-2 shadow-sm">
                <span className="text-gray-600">🔬 NPK:</span>{' '}
                <span className="font-semibold text-purple-600">
                  {(sensorData.nitrogen !== '...' && sensorData.phosphorus !== '...' && sensorData.potassium !== '...') 
                    ? `${sensorData.nitrogen}-${sensorData.phosphorus}-${sensorData.potassium}` 
                    : '...'}
                </span>
              </div>
            </div>
            
            {/* Soil Type Display */}
            {sensorData.soilType && (
              <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🏜️</span>
                  <span className="text-sm text-amber-700 font-semibold">
                    {language === 'hi' ? 'मिट्टी का प्रकार:' : language === 'mr' ? 'मातीचा प्रकार:' : 'Soil Type:'}
                  </span>
                  <span className="text-lg font-black text-amber-900 uppercase">
                    {sensorData.soilType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-amber-900 mb-4">
              {language === 'hi' ? 'एआई सिफारिशें प्राप्त करें' : language === 'mr' ? 'एआय शिफारसी मिळवा' : 'Get AI Recommendations'}
            </h2>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <button
                onClick={getPrediction}
                disabled={loading || sensorData.temperature === '...' || sensorLoading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? `⏳ ${language === 'hi' ? 'प्रसंस्करण...' : language === 'mr' ? 'प्रक्रिया...' : 'Processing...'}` : `🚀 ${language === 'hi' ? 'सिफारिश प्राप्त करें' : language === 'mr' ? 'शिफारस मिळवा' : 'Get Recommendation'}`}
              </button>
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  {language === 'hi' ? 'रोकें' : language === 'mr' ? 'थांबवा' : 'Stop'}
                </button>
              )}
            </div>
            {(sensorData.temperature === '...' || sensorLoading) && (
              <p className="text-sm text-amber-600 mt-3">
                ⏳ {language === 'hi' ? 'सेंसर डेटा लोड हो रहा है...' : language === 'mr' ? 'सेन्सर डेटा लोड होत आहे...' : 'Loading sensor data...'}
              </p>
            )}
          </div>
        </div>

        {/* Recommendation Card */}
        <RecommendationCard
          prediction={prediction}
          onApprove={handleApprove}
          approving={false}
          zoneInfo={{
            soilType: sensorData.soilType ? sensorData.soilType.replace(/_/g, ' ').toUpperCase() : 'Unknown',
            crop: selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1),
            region: 'West Maharashtra'
          }}
        />

        {!prediction && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{language === 'hi' ? 'मदद के लिए तैयार' : language === 'mr' ? 'मदतीसाठी तयार' : 'Ready to Help'}</h2>
            <p className="text-gray-600">{language === 'hi' ? 'सिफारिशें प्राप्त करने के लिए बटन पर क्लिक करें' : language === 'mr' ? 'शिफारसी मिळवण्यासाठी बटण क्लिक करा' : 'Click the button to get recommendations'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
