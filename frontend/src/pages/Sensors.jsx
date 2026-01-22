import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api/api';
import { useLanguage } from '../context/LanguageContext';

// Zone display name mapping
const ZONE_LABELS = {
  'CS1': '🌾 Coarse - Groundnut', 'CS2': '🌾 Coarse - Bajra', 'CS3': '🍉 Coarse - Watermelon',
  'BS1': '🌿 Black - Cotton', 'BS2': '🌱 Black - Soybean', 'BS3': '🌾 Black - Jowar',
  'LS1': '🌰 Laterite - Cashew', 'LS2': '🥥 Laterite - Coconut', 'LS3': '🌾 Laterite - Rice',
  'AS1': '🍬 Alluvial - Sugarcane', 'AS2': '🌾 Alluvial - Wheat', 'AS3': '🍌 Alluvial - Banana',
  'YS1': '🌾 Yellow-Brown - Rice', 'YS2': '🌾 Yellow-Brown - Ragi', 'YS3': '🌾 Yellow-Brown - Tur',
};

const Sensors = () => {
  const { t } = useLanguage();
  const [zones, setZones] = useState([]);
  const [sensorData, setSensorData] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadAllSensors();
    
    // Auto-refresh every hour
    const interval = setInterval(() => {
      loadAllSensors();
    }, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(interval);
  }, []);

  const loadAllSensors = async () => {
    setLoading(true);
    try {
      const zonesResponse = await farmAPI.getZones();
      const zonesList = zonesResponse.data.zones;
      setZones(zonesList);

      // Load latest data for all zones
      const dataPromises = zonesList.map(async (zone) => {
        try {
          const response = await farmAPI.getLatest(zone);
          return { zone, data: response.data.data };
        } catch (error) {
          return { zone, data: null };
        }
      });

      const results = await Promise.all(dataPromises);
      const dataMap = {};
      results.forEach(({ zone, data }) => {
        dataMap[zone] = data;
      });
      setSensorData(dataMap);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading sensors:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📡 {t.sensors.title}
          </h1>
          <p className="text-lg text-gray-600">{t.sensors.subtitle}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone) => {
              const data = sensorData[zone];
              const sensor = data?.sensor || {};
              const weather = data?.weather || {};

              return (
                <div
                  key={zone}
                  className="backdrop-blur-lg bg-white/50 rounded-2xl shadow-xl p-6 border-2 border-white/60 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  {/* Zone Header */}
                  <div className="mb-4 pb-4 border-b-2 border-gray-200">
                    <h3 className="text-xl font-black text-gray-800 flex items-center">
                      <span className="text-2xl mr-2">📍</span>
                      {ZONE_LABELS[zone] || zone}
                    </h3>
                    {sensor.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t.sensors.updated}: {formatTimestamp(sensor.timestamp)}
                      </p>
                    )}
                  </div>

                  {/* Sensor Readings */}
                  <div className="space-y-3">
                    {/* Soil Moisture */}
                    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-blue-700">💧 {t.sensors.moisture}</span>
                        <span className="text-lg font-black text-blue-800">
                          {formatNumber(sensor.soil_moisture, 1)}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                          style={{ width: `${sensor.soil_moisture || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-orange-700">🌡️ {t.sensors.temperature}</span>
                        <span className="text-lg font-black text-orange-800">
                          {formatNumber(sensor.temperature, 1)}°C
                        </span>
                      </div>
                    </div>

                    {/* Humidity */}
                    <div className="bg-gradient-to-r from-teal-100 to-green-100 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-teal-700">💨 {t.sensors.humidity}</span>
                        <span className="text-lg font-black text-teal-800">
                          {formatNumber(sensor.humidity, 0)}%
                        </span>
                      </div>
                    </div>

                    {/* NPK Nutrients */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-purple-100 rounded-lg p-2 text-center">
                        <p className="text-xs font-semibold text-purple-700">N</p>
                        <p className="text-sm font-black text-purple-800">{formatNumber(sensor.nitrogen, 0)}</p>
                      </div>
                      <div className="bg-yellow-100 rounded-lg p-2 text-center">
                        <p className="text-xs font-semibold text-yellow-700">P</p>
                        <p className="text-sm font-black text-yellow-800">{formatNumber(sensor.phosphorus, 0)}</p>
                      </div>
                      <div className="bg-pink-100 rounded-lg p-2 text-center">
                        <p className="text-xs font-semibold text-pink-700">K</p>
                        <p className="text-sm font-black text-pink-808">{formatNumber(sensor.potassium, 0)}</p>
                      </div>
                    </div>

                    {/* pH */}
                    <div className="bg-green-100 rounded-lg p-3 text-center">
                      <p className="text-xs font-semibold text-green-700">{t.sensors.phLevel}</p>
                      <p className="text-lg font-black text-green-800">{formatNumber(sensor.ph, 2)}</p>
                    </div>

                    {/* Status Badge */}
                    <div className="text-center pt-2">
                      <span className="inline-block px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        ✓ {t.sensors.active}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && zones.length > 0 && (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="backdrop-blur-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 text-center">
              <p className="text-sm opacity-90">{t.sensors.totalSensors}</p>
              <p className="text-4xl font-black">{zones.length}</p>
            </div>
            <div className="backdrop-blur-lg bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 text-center">
              <p className="text-sm opacity-90">{t.sensors.activeZones}</p>
              <p className="text-4xl font-black">{zones.length}</p>
            </div>
            <div className="backdrop-blur-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 text-center">
              <p className="text-sm opacity-90">{t.sensors.soilTypes}</p>
              <p className="text-4xl font-black">5</p>
            </div>
            <div className="backdrop-blur-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 text-center">
              <p className="text-sm opacity-90">{t.sensors.cropTypes}</p>
              <p className="text-4xl font-black">3</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sensors;
