import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Sensors = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const [sensorData, setSensorData] = useState({
    temperature: 26.2,
    humidity: 65,
    weatherCondition: 'Overcast',
    soilMoisture: 62,
    soilTemperature: 18.8,
    nitrogen: 87.5,
    phosphorus: 32.9,
    potassium: 167.6
  });

  useEffect(() => {
    loadSensorData();
    const interval = setInterval(loadSensorData, 60000); // 1 minute
    return () => clearInterval(interval);
  }, []);

  const loadSensorData = async () => {
    console.log('🔄 Loading sensor data...');
    setLoading(true);
    
    try {
      // Fetch weather
      const weatherRes = await fetch('https://api.weatherapi.com/v1/current.json?key=079a0828828c4c57af2133300262401&q=Mumbai&aqi=no');
      const weatherData = await weatherRes.json();
      console.log('Weather:', weatherData);
      
      if (weatherData.current) {
        setSensorData(prev => ({
          ...prev,
          temperature: weatherData.current.temp_c,
          humidity: weatherData.current.humidity,
          weatherCondition: weatherData.current.condition.text
        }));
      }
      
      // Fetch soil  
      const soilRes = await fetch('https://api.agromonitoring.com/agro/1.0/soil?lat=19.0760&lon=72.8777&appid=97f32bc1c704c19fbb76c734b0c127b6');
      const soilData = await soilRes.json();
      console.log('Soil:', soilData);
      
      if (soilData.moisture !== undefined) {
        setSensorData(prev => ({
          ...prev,
          soilMoisture: Math.round(soilData.moisture * 100),
          soilTemperature: soilData.t10 ? (soilData.t10 - 273.15).toFixed(1) : prev.soilTemperature
        }));
      }
      
      setLastUpdate(new Date());
      console.log('✅ Data loaded');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toFixed(decimals);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 pt-16 lg:pt-0">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-2 flex items-center justify-center gap-3">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            {t.sensors.title}
          </h1>
          <p className="text-lg text-amber-700">{t.sensors.subtitle}</p>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-2">
              🕐 {t.sensors.currentHourData} • {t.sensors.lastRefreshed}: {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <p className="text-xl text-gray-600">{t.sensors.loadingSensors}</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Card 1: Live Weather */}
            <div className="backdrop-blur-lg bg-white/50 rounded-2xl shadow-xl p-6 border-2 border-white/60">
              <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-200">
                <span className="text-3xl mr-3">🌤️</span>
                <h3 className="text-2xl font-black text-gray-800">Live Weather Data</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temperature */}
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-700 mb-1">🌡️ Temperature</p>
                      <p className="text-4xl font-black text-amber-900">
                        {sensorData.temperature}°C
                      </p>
                      <p className="text-sm text-amber-600 mt-2">☁️ {sensorData.weatherCondition}</p>
                    </div>
                  </div>
                </div>

                {/* Humidity */}
                <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-6">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 mb-1">💧 Humidity</p>
                    <p className="text-4xl font-black text-blue-900 mb-3">
                      {sensorData.humidity}%
                    </p>
                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                        style={{ width: `${sensorData.humidity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Live Soil Info */}
            <div className="backdrop-blur-lg bg-white/50 rounded-2xl shadow-xl p-6 border-2 border-white/60">
              <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-200">
                <span className="text-3xl mr-3">🌱</span>
                <h3 className="text-2xl font-black text-gray-800">Live Soil Info</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Soil Moisture */}
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-6">
                  <div>
                    <p className="text-sm font-semibold text-green-700 mb-1">💦 Soil Moisture</p>
                    <p className="text-4xl font-black text-green-900 mb-3">
                      {sensorData.soilMoisture}%
                    </p>
                    <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all duration-1000"
                        style={{ width: `${sensorData.soilMoisture}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Soil Temperature */}
                <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-orange-700 mb-1">🌡️ Soil Temperature</p>
                      <p className="text-4xl font-black text-orange-900">
                        {sensorData.soilTemperature}°C
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: NPK Nutrients */}
            <div className="backdrop-blur-lg bg-white/50 rounded-2xl shadow-xl p-6 border-2 border-white/60">
              <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-200">
                <span className="text-3xl mr-3">🧪</span>
                <h3 className="text-2xl font-black text-gray-800">NPK Nutrients</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Nitrogen */}
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl font-black text-purple-700">N</span>
                  </div>
                  <p className="text-sm font-semibold text-purple-700 mb-2">Nitrogen</p>
                  <p className="text-3xl font-black text-purple-900">
                    {sensorData.nitrogen.toFixed(1)}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">mg/kg</p>
                </div>

                {/* Phosphorus */}
                <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl font-black text-orange-700">P</span>
                  </div>
                  <p className="text-sm font-semibold text-orange-700 mb-2">Phosphorus</p>
                  <p className="text-3xl font-black text-orange-900">
                    {sensorData.phosphorus.toFixed(1)}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">mg/kg</p>
                </div>

                {/* Potassium */}
                <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl font-black text-pink-700">K</span>
                  </div>
                  <p className="text-sm font-semibold text-pink-700 mb-2">Potassium</p>
                  <p className="text-3xl font-black text-pink-900">
                    {sensorData.potassium.toFixed(1)}
                  </p>
                  <p className="text-xs text-pink-600 mt-1">mg/kg</p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="text-center">
              <button
                onClick={loadSensorData}
                disabled={loading}
                className="px-8 py-4 bg-amber-600 text-white text-lg rounded-xl font-bold hover:bg-amber-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? '⏳ Refreshing...' : '🔄 Refresh Data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sensors;
