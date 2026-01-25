import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const RecommendationCard = ({ prediction, onApprove, approving, zoneInfo }) => {
  const { t, language } = useLanguage();
  
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
  
  if (!prediction) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        {language === 'hi' ? 'AI-संचालित कृषि सलाह प्राप्त करने के लिए "सिफारिश प्राप्त करें" पर क्लिक करें' : 
         language === 'mr' ? 'AI-आधारित शेती सल्ला मिळवण्यासाठी "शिफारस मिळवा" वर क्लिक करा' : 
         'Click "Get Recommendation" to receive ML-powered farming advice'}
      </div>
    );
  }

  // Check if this is crop prediction or irrigation/fertilizer prediction
  const isCropPrediction = prediction.data && prediction.data.predicted_crop;
  
  // Handle crop prediction format
  if (isCropPrediction) {
    const cropData = prediction.data;
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg p-6 border-2 border-green-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            🌾 {language === 'hi' ? 'फसल सिफारिश' : language === 'mr' ? 'पीक शिफारस' : 'Crop Recommendation'}
          </h3>
          <span className="text-xs px-3 py-1 bg-green-600 text-white rounded-full">
            {cropData.season?.toUpperCase() || 'SEASON'}
          </span>
        </div>

        {/* Recommended Crop - Large Display */}
        <div className="bg-white rounded-xl p-6 mb-4 text-center border-2 border-green-400 shadow-md">
          <p className="text-sm text-gray-600 mb-2">
            {language === 'hi' ? 'अनुशंसित फसल' : language === 'mr' ? 'शिफारस केलेले पीक' : 'Recommended Crop'}
          </p>
          <h2 className="text-4xl font-bold text-green-700 uppercase mb-2">
            {cropData.predicted_crop}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-semibold text-gray-700">
              {language === 'hi' ? 'आत्मविश्वास:' : language === 'mr' ? 'विश्वास:' : 'Confidence:'}
            </span>
            <span className="text-2xl font-bold text-green-600">
              {cropData.confidence ? `${(cropData.confidence * 100).toFixed(1)}%` : `${cropData.confidence_percent || '0%'}`}
            </span>
          </div>
        </div>

        {/* Top 3 Alternatives */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            🏆 {language === 'hi' ? 'शीर्ष 3 विकल्प' : language === 'mr' ? 'टॉप 3 पर्याय' : 'Top 3 Options'}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {cropData.top_3_crops?.map((crop, index) => (
              <div key={index} className={`bg-white rounded-lg p-3 text-center border-2 ${index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <div className="text-2xl mb-1">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                <p className="font-semibold text-gray-800 text-sm uppercase">{crop.crop}</p>
                <p className="text-xs text-gray-600">{(crop.probability * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-green-500">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            💡 {language === 'hi' ? 'AI व्याख्या' : language === 'mr' ? 'AI स्पष्टीकरण' : 'Explanation'}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">{cropData.explanation}</p>
        </div>

        {/* Input Summary */}
        {cropData.input_summary && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              {language === 'hi' ? 'वर्तमान स्थिति' : language === 'mr' ? 'सद्यस्थिती' : 'Current Conditions'}
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-600">{language === 'hi' ? 'तापमान:' : language === 'mr' ? 'तापमान:' : 'Temp:'}</span>{' '}
                <span className="font-semibold">{cropData.input_summary.air_temp}°C</span>
              </div>
              <div>
                <span className="text-gray-600">{language === 'hi' ? 'नमी:' : language === 'mr' ? 'नमी:' : 'Humidity:'}</span>{' '}
                <span className="font-semibold">{cropData.input_summary.humidity}%</span>
              </div>
              <div>
                <span className="text-gray-600">{language === 'hi' ? 'मिट्टी:' : language === 'mr' ? 'माती:' : 'Soil:'}</span>{' '}
                <span className="font-semibold">{cropData.input_summary.soil_type}</span>
              </div>
            </div>
          </div>
        )}

        {/* Approve Button */}
        <button
          onClick={onApprove}
          disabled={approving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {approving ? (
            <>
              <span className="loading mr-2"></span>
              {language === 'hi' ? 'स्वीकृत किया जा रहा है...' : language === 'mr' ? 'मंजूर होत आहे...' : 'Approving...'}
            </>
          ) : (
            <>
              ✓ {language === 'hi' ? 'कार्रवाई स्वीकृत करें' : language === 'mr' ? 'कृती मंजूर करा' : 'Approve Action'}
            </>
          )}
        </button>
      </div>
    );
  }

  // Handle irrigation/fertilizer prediction format (existing code)
  const predictions = prediction.predictions || prediction;
  const explanation = prediction.explanation || 'AI-based irrigation and fertilizer recommendation';
  const model_used = prediction.model_used || 'Irrigation & Fertilizer Model';
  const predicted_at = prediction.predicted_at || new Date().toISOString();
  const input_summary = prediction.input_summary || {
    soil_moisture: prediction.soil_moisture || 0,
    temperature: prediction.air_temp || prediction.temperature || 0,
    rainfall: prediction.rainfall || 0,
    nitrogen: prediction.nitrogen || 0,
    phosphorus: prediction.phosphorus || 0,
    potassium: prediction.potassium || 0
  };
  
  const farmSize = 1; // 1 acre farm

  return (
    <div className="bg-gradient-to-br from-primary-50 to-green-50 rounded-lg shadow-lg p-6 border-2 border-primary-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          🤖 {language === 'hi' ? 'AI सिफारिश' : language === 'mr' ? 'AI शिफारस' : 'AI Recommendation'}
        </h3>
        <span className="text-xs px-3 py-1 bg-primary-600 text-white rounded-full">
          {model_used}
        </span>
      </div>

      {/* Farm & Soil Information */}
      {zoneInfo && (
        <div className="bg-white rounded-lg p-4 mb-4 border-2 border-amber-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Soil Information */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <span className="text-lg">🌱</span> {language === 'hi' ? 'मिट्टी की जानकारी' : language === 'mr' ? 'मातीची माहिती' : 'Soil Information'}
              </p>
              <div className="space-y-1">
                <div className="flex items-start">
                  <span className="text-xs text-gray-600 w-20">{language === 'hi' ? 'प्रकार:' : language === 'mr' ? 'प्रकार:' : 'Type:'}</span>
                  <span className="text-sm font-semibold text-gray-800">{zoneInfo.soilType}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-xs text-gray-600 w-20">{language === 'hi' ? 'फसल:' : language === 'mr' ? 'पिक:' : 'Crop:'}</span>
                  <span className="text-sm font-semibold text-gray-800">{zoneInfo.crop}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-xs text-gray-600 w-20">{language === 'hi' ? 'क्षेत्र:' : language === 'mr' ? 'प्रदेश:' : 'Region:'}</span>
                  <span className="text-sm font-semibold text-gray-800">{zoneInfo.region}</span>
                </div>
              </div>
            </div>
            
            {/* Farm Information */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                <span className="text-lg">🚜</span> {language === 'hi' ? 'खेत की जानकारी' : language === 'mr' ? 'शेताची माहिती' : 'Farm Information'}
              </p>
              <div className="space-y-1">
                <div className="flex items-start">
                  <span className="text-xs text-gray-600 w-20">{language === 'hi' ? 'आकार:' : language === 'mr' ? 'आकार:' : 'Size:'}</span>
                  <span className="text-sm font-semibold text-gray-800">{farmSize} {language === 'hi' ? 'एकड़' : language === 'mr' ? 'एकर' : 'Acre'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-xs text-gray-600 w-20">{language === 'hi' ? 'क्षेत्रफल:' : language === 'mr' ? 'क्षेत्रफळ:' : 'Area:'}</span>
                  <span className="text-sm font-semibold text-gray-800">{(farmSize * 4046.86).toFixed(0)} m²</span>
                </div>
                <div className="flex items-start">
                  <span className="text-xs text-gray-600 w-20">{language === 'hi' ? 'स्थान:' : language === 'mr' ? 'स्थान:' : 'Location:'}</span>
                  <span className="text-sm font-semibold text-gray-800">{language === 'hi' ? 'महाराष्ट्र, भारत' : language === 'mr' ? 'महाराष्ट्र, भारत' : 'Maharashtra, India'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">{language === 'hi' ? 'सिंचाई' : language === 'mr' ? 'सिंचन' : 'Irrigation'}</p>
          <p className="text-2xl font-bold text-blue-600">
            {(predictions.irrigation_liters || 0).toFixed(0)}
            <span className="text-sm ml-1">L</span>
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">{language === 'hi' ? 'नाइट्रोजन (N)' : language === 'mr' ? 'नायट्रोजन (N)' : 'Nitrogen (N)'}</p>
          <p className="text-2xl font-bold text-green-600">
            {(predictions.fertilizer_N_g || 0).toFixed(0)}
            <span className="text-sm ml-1">g</span>
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">{language === 'hi' ? 'फास्फोरस (P)' : language === 'mr' ? 'फॉस्फरस (P)' : 'Phosphorus (P)'}</p>
          <p className="text-2xl font-bold text-yellow-600">
            {(predictions.fertilizer_P_g || 0).toFixed(0)}
            <span className="text-sm ml-1">g</span>
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">{language === 'hi' ? 'पोटैशियम (K)' : language === 'mr' ? 'पोटॅशियम (K)' : 'Potassium (K)'}</p>
          <p className="text-2xl font-bold text-purple-600">
            {(predictions.fertilizer_K_g || 0).toFixed(0)}
            <span className="text-sm ml-1">g</span>
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-primary-500">
        <p className="text-sm font-semibold text-gray-700 mb-2">
          💡 {language === 'hi' ? 'AI व्याख्या' : language === 'mr' ? 'AI स्पष्टीकरण' : 'Explanation'}
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">{translateExplanation(explanation, language)}</p>
      </div>

      {/* Input Summary */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          {language === 'hi' ? 'वर्तमान स्थिति (मॉडल इनपुट)' : language === 'mr' ? 'सद्यस्थिती (मॉडेल इनपुट)' : 'Current Conditions'}
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-gray-600">{language === 'hi' ? 'नमी:' : language === 'mr' ? 'नमी:' : 'Moisture:'}</span>{' '}
            <span className="font-semibold">{input_summary.soil_moisture}%</span>
          </div>
          <div>
            <span className="text-gray-600">{language === 'hi' ? 'तापमान:' : language === 'mr' ? 'तापमान:' : 'Temp:'}</span>{' '}
            <span className="font-semibold">{input_summary.temperature}°C</span>
          </div>
          <div>
            <span className="text-gray-600">{language === 'hi' ? 'बारिश:' : language === 'mr' ? 'पाऊस:' : 'Rainfall:'}</span>{' '}
            <span className="font-semibold">{input_summary.rainfall}mm</span>
          </div>
          <div>
            <span className="text-gray-600">N:</span>{' '}
            <span className="font-semibold">{input_summary.nitrogen}</span>
          </div>
          <div>
            <span className="text-gray-600">P:</span>{' '}
            <span className="font-semibold">{input_summary.phosphorus}</span>
          </div>
          <div>
            <span className="text-gray-600">K:</span>{' '}
            <span className="font-semibold">{input_summary.potassium}</span>
          </div>
        </div>
      </div>

      {/* Approve Button */}
      <button
        onClick={onApprove}
        disabled={approving}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {approving ? (
          <>
            <span className="loading mr-2"></span>
            {language === 'hi' ? 'स्वीकृत किया जा रहा है...' : language === 'mr' ? 'मंजूर होत आहे...' : 'Approving...'}
          </>
        ) : (
          <>
            ✓ {language === 'hi' ? 'कार्रवाई स्वीकृत करें' : language === 'mr' ? 'कृती मंजूर करा' : 'Approve Action'}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-2">
        {language === 'hi' ? 'पूर्वानुमान समय:' : language === 'mr' ? 'अंदाज वेळ:' : 'Predicted at:'} {new Date(predicted_at).toLocaleString()}
      </p>
    </div>
  );
};

export default RecommendationCard;
