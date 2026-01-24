import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api/api';
import RecommendationCard from '../components/RecommendationCard';
import { db } from '../offline/db';
import { useLanguage } from '../context/LanguageContext';

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

const Recommendations = () => {
  const { t, language, getZoneLabel } = useLanguage();
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Translation function for explanation text
  const translateExplanation = (text) => {
    if (language === 'en' || !text) return text;
    
    // Generate a Hindi/Marathi summary from the numbers in prediction
    if (prediction && prediction.predictions) {
      const { irrigation_liters, fertilizer_N_g, fertilizer_P_g, fertilizer_K_g } = prediction.predictions;
      
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
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await farmAPI.getZones();
      setZones(response.data.zones);
      // Update IndexedDB cache
      await db.zones.clear();
      await db.zones.bulkAdd(response.data.zones.map((z) => ({ id: z })));
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const refreshZones = async () => {
    setRefreshing(true);
    try {
      // Clear IndexedDB cache first
      await db.zones.clear();
      await loadZones();
      alert('✓ Zones refreshed from database!');
    } catch (error) {
      console.error('Error refreshing zones:', error);
      alert('Failed to refresh zones');
    } finally {
      setRefreshing(false);
    }
  };

  const getPrediction = async () => {
    if (!selectedZone) {
      alert('Please select a zone first');
      return;
    }

    setLoading(true);
    try {
      const response = await farmAPI.predict(selectedZone);
      setPrediction(response.data.prediction);
      
      // Speak the recommendation after receiving it
      if (response.data.prediction && response.data.prediction.explanation) {
        speakText(response.data.prediction.explanation);
      }
    } catch (error) {
      console.error('Error getting prediction:', error);
      alert('Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!prediction) return;

    try {
      await farmAPI.saveAction({
        zone_id: selectedZone,
        timestamp: new Date().toISOString(),
        irrigation_liters: prediction.predictions.irrigation_liters,
        fertilizer_N_g: prediction.predictions.fertilizer_N_g,
        fertilizer_P_g: prediction.predictions.fertilizer_P_g,
        fertilizer_K_g: prediction.predictions.fertilizer_K_g,
        model_used: prediction.model_used,
        explanation: prediction.explanation
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

        {/* Zone Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-lg font-semibold text-amber-900">
              {t.recommendations.selectZone}
            </label>
            <button
              onClick={refreshZones}
              disabled={refreshing}
              className="text-sm px-3 py-1 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50 font-medium border border-amber-200"
            >
              {refreshing ? t.recommendations.refreshing : t.recommendations.refreshZones}
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white text-amber-900 font-medium"
            >
              <option value="">{t.recommendations.selectAZone}</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {getZoneLabel(zone)}
                </option>
              ))}
            </select>
            <button
              onClick={getPrediction}
              disabled={loading || !selectedZone}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? `⏳ ${t.recommendations.processing}` : `🚀 ${t.recommendations.getRecommendation}`}
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
          {zones.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              📊 {zones.length} {t.recommendations.zonesLoaded}
            </p>
          )}
        </div>

        {/* Recommendation Card */}
        <RecommendationCard
          prediction={prediction}
          onApprove={handleApprove}
          approving={false}
          zoneInfo={selectedZone ? getZoneInfo(selectedZone) : null}
        />

        {!prediction && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.recommendations.readyToHelp}</h2>
            <p className="text-gray-600">{t.recommendations.selectZonePrompt}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
