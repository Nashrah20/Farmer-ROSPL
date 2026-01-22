import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

const ModernDashboard = () => {
  const { t, getZoneLabel, language } = useLanguage();
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [currentData, setCurrentData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadZones();
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

  const loadZones = async () => {
    try {
      const response = await farmAPI.getZones();
      setZones(response.data.zones);
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const handleZoneChange = async (zone) => {
    setSelectedZone(zone);
    setPredictions(null);
    
    if (!zone) return;

    try {
      const response = await farmAPI.getLatest(zone);
      setCurrentData(response.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative container mx-auto px-4 py-4 md:py-8">
        {/* Time Display */}
        <div className="text-center mb-6 backdrop-blur-lg bg-white/30 rounded-2xl p-4 border border-white/50 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            <span className="text-2xl">🕐</span>
            <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <div className="inline-block">
            <div className="flex items-center justify-center space-x-2 md:space-x-4 mb-4">
              <div className="text-4xl md:text-6xl animate-bounce">🌾</div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.appName}
              </h1>
              <div className="text-4xl md:text-6xl animate-bounce animation-delay-1000">🚀</div>
            </div>
            <p className="text-base md:text-xl text-gray-600 font-semibold">{t.tagline}</p>
          </div>
        </div>

        {/* Zone Selector - Glassmorphism Card */}
        <div className="max-w-4xl mx-auto mb-6 md:mb-8 backdrop-blur-lg bg-white/30 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 border border-white/50 transform hover:scale-105 transition-all duration-300">
          <label className="block text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center">
            <span className="text-2xl md:text-3xl mr-2 md:mr-3">🎯</span>
            <span className="text-base md:text-2xl">{t.dashboard.selectZone}</span>
          </label>
          <select
            value={selectedZone}
            onChange={(e) => handleZoneChange(e.target.value)}
            className="w-full px-4 md:px-6 py-3 md:py-4 text-base md:text-lg font-semibold rounded-xl md:rounded-2xl border-2 border-purple-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 outline-none transition-all bg-white/80 backdrop-blur"
          >
            <option value="">🌍 {t.dashboard.chooseZone}</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {getZoneLabel(zone)}
              </option>
            ))}
          </select>
        </div>

        {currentData && (
          <>
            {/* Current Conditions - Creative Grid */}
            <div className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-center mb-4 md:mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {t.dashboard.liveConditions}
              </h2>
              
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                {/* Soil Moisture - Animated Card */}
                <div className="group relative backdrop-blur-md bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-3xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  <div className="absolute -top-4 -right-4 text-5xl animate-spin-slow">💧</div>
                  <p className="text-sm font-semibold text-blue-700 mb-2">{t.dashboard.soilMoisture}</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {formatNumber(currentData.sensor?.soil_moisture, 2)}%
                  </p>
                  <div className="mt-3 h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000"
                      style={{ width: `${currentData.sensor?.soil_moisture || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Temperature */}
                <div className="group relative backdrop-blur-md bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-3xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  <div className="absolute -top-4 -right-4 text-5xl animate-pulse">🌡️</div>
                  <p className="text-sm font-semibold text-orange-700 mb-2">{t.dashboard.temperature}</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {formatNumber(currentData.sensor?.temperature, 1)}°C
                  </p>
                  <p className="text-xs text-orange-600 mt-2 font-semibold">
                    {currentData.sensor?.temperature > 30 ? `🔥 ${t.dashboard.hot}` : currentData.sensor?.temperature > 20 ? `😊 ${t.dashboard.perfect}` : `❄️ ${t.dashboard.cool}`}
                  </p>
                </div>

                {/* Humidity */}
                <div className="group relative backdrop-blur-md bg-gradient-to-br from-teal-400/20 to-green-400/20 rounded-3xl p-6 border border-white/50 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  <div className="absolute -top-4 -right-4 text-5xl">💨</div>
                  <p className="text-sm font-semibold text-teal-700 mb-2">{t.dashboard.humidity}</p>
                  <p className="text-4xl font-black bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                    {formatNumber(currentData.sensor?.humidity, 0)}%
                  </p>
                  <div className="mt-3 h-2 bg-teal-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-green-500 rounded-full transition-all duration-1000"
                      style={{ width: `${currentData.sensor?.humidity || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* NPK Nutrients - Futuristic Cards */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
                <span className="text-3xl mr-2">🧪</span>
                {t.dashboard.soilNutrients}
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="backdrop-blur-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-300 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl">🔵</span>
                    <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">{t.dashboard.nitrogen}</span>
                  </div>
                  <p className="text-3xl font-black text-purple-700">{formatNumber(currentData.sensor?.nitrogen, 2)}</p>
                  <p className="text-xs text-purple-600">mg/kg</p>
                </div>

                <div className="backdrop-blur-md bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-300 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl">🟡</span>
                    <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">{t.dashboard.phosphorus}</span>
                  </div>
                  <p className="text-3xl font-black text-yellow-700">{formatNumber(currentData.sensor?.phosphorus, 2)}</p>
                  <p className="text-xs text-yellow-600">mg/kg</p>
                </div>

                <div className="backdrop-blur-md bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl p-6 border border-pink-300 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-4xl">🟣</span>
                    <span className="text-xs font-bold text-pink-700 bg-pink-100 px-3 py-1 rounded-full">{t.dashboard.potassium}</span>
                  </div>
                  <p className="text-3xl font-black text-pink-700">{formatNumber(currentData.sensor?.potassium, 2)}</p>
                  <p className="text-xs text-pink-600">mg/kg</p>
                </div>
              </div>
            </div>

            {/* AI Recommendations Button */}
            <div className="text-center mb-8">
              <button
                onClick={getRecommendations}
                disabled={loading}
                className="group relative px-12 py-6 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white text-xl font-black rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center">
                  {loading ? (
                    <>
                      <div className="animate-spin mr-3 text-3xl">⏳</div>
                      {t.dashboard.processingMagic}
                    </>
                  ) : (
                    <>
                      <span className="text-3xl mr-3 group-hover:animate-bounce">🤖</span>
                      {t.dashboard.getAIRecommendations}
                      <span className="text-3xl ml-3 group-hover:animate-bounce">✨</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
              </button>
            </div>

            {/* Predictions - Ultra Modern Cards */}
            {predictions && (
              <>
                {/* Model Info Banner */}
                {modelInfo && (
                  <div className="mb-6 backdrop-blur-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 rounded-2xl p-4 border-2 border-purple-300/50 shadow-xl">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl animate-pulse">🤖</span>
                        <div>
                          <h3 className="text-xl font-black text-purple-900">{t.dashboard.aiRecommendation}</h3>
                          <p className="text-sm text-purple-700">{t.dashboard.poweredByML}</p>
                        </div>
                      </div>
                      <span className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold shadow-lg">
                        {modelInfo.model_used}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-3xl p-8 border-2 border-white/50 shadow-2xl">
                    <div className="flex items-center mb-4">
                      <div className="text-6xl mr-4 animate-pulse">💧</div>
                      <div>
                        <h3 className="text-2xl font-black text-blue-900">{t.dashboard.waterNeeded}</h3>
                        <p className="text-sm text-blue-700">{t.dashboard.irrigationRecommendation}</p>
                      </div>
                    </div>
                    <p className="text-6xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                      {formatNumber(predictions.irrigation_liters, 0)}
                    </p>
                    <p className="text-xl text-blue-700 font-bold">{t.dashboard.liters}</p>
                  </div>

                  <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-3xl p-8 border-2 border-white/50 shadow-2xl">
                    <div className="flex items-center mb-4">
                      <div className="text-6xl mr-4">🌱</div>
                      <div>
                        <h3 className="text-2xl font-black text-green-900">{t.dashboard.fertilizerMix}</h3>
                        <p className="text-sm text-green-700">{t.dashboard.npkRecommendation}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white/50 rounded-xl p-3">
                        <span className="font-bold text-purple-700">🔵 N</span>
                        <span className="text-2xl font-black text-purple-700">{formatNumber(predictions.fertilizer_N_g, 0)}g</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/50 rounded-xl p-3">
                        <span className="font-bold text-yellow-700">🟡 P</span>
                        <span className="text-2xl font-black text-yellow-700">{formatNumber(predictions.fertilizer_P_g, 0)}g</span>
                      </div>
                      <div className="flex items-center justify-between bg-white/50 rounded-xl p-3">
                        <span className="font-bold text-pink-700">🟣 K</span>
                        <span className="text-2xl font-black text-pink-700">{formatNumber(predictions.fertilizer_K_g, 0)}g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explanation Section */}
                {modelInfo && modelInfo.explanation && (
                  <div className="mb-6 backdrop-blur-xl bg-gradient-to-r from-amber-100/50 to-yellow-100/50 rounded-2xl p-6 border-2 border-amber-300/50 shadow-xl">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">💡</span>
                      <div>
                        <h4 className="text-xl font-black text-amber-900 mb-2">{t.dashboard.aiExplanation}</h4>
                        <p className="text-gray-700 leading-relaxed">{modelInfo.explanation}</p>
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
          <div className="text-center backdrop-blur-lg bg-white/30 rounded-3xl p-16 border border-white/50">
            <div className="text-9xl mb-6 animate-bounce">🌾</div>
            <h2 className="text-4xl font-black text-gray-800 mb-4">{t.dashboard.welcomeToFarmAI}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
