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
import ChartsPanel from '../components/ChartsPanel';

const Analytics = () => {
  const { t } = useLanguage();
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await farmAPI.getZones();
      setZones(response.data.zones);
      if (response.data.zones.length > 0) {
        setSelectedZone(response.data.zones[0]);
        loadHistory(response.data.zones[0]);
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const loadHistory = async (zoneId) => {
    setLoading(true);
    try {
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);

      const response = await farmAPI.getHistory(
        zoneId,
        fromDate.toISOString(),
        toDate.toISOString(),
        1000
      );
      setHistoryData(response.data.history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleZoneChange = (e) => {
    const zone = e.target.value;
    setSelectedZone(zone);
    loadHistory(zone);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 pt-16 lg:pt-0">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-amber-900 mb-2 flex items-center gap-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            {t.analytics.title}
          </h1>
          <p className="text-amber-700">{t.analytics.subtitle}</p>
        </div>

        {/* Zone Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 p-6 mb-6">
          <label className="block text-lg font-semibold text-amber-900 mb-3">
            {t.analytics.selectZone}
          </label>
          <select
            value={selectedZone}
            onChange={handleZoneChange}
            className="w-full md:w-96 px-4 py-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white text-amber-900 font-medium"
          >
            <option value="">{t.analytics.selectAZone}</option>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {ZONE_LABELS[zone] || zone}
              </option>
            ))}
          </select>
        </div>

        {/* Charts */}
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 p-12 text-center">
            <svg className="w-16 h-16 text-amber-700 mx-auto mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-amber-800 font-medium">{t.analytics.loadingAnalytics}</p>
          </div>
        ) : historyData ? (
          <div className="space-y-6">
            <ChartsPanel historyData={historyData} />
            
            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm opacity-90">{t.analytics.totalDataPoints}</p>
                <p className="text-3xl font-bold">{historyData.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm opacity-90">{t.analytics.daysTracked}</p>
                <p className="text-3xl font-bold">30</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
                <div className="text-3xl mb-2">🌱</div>
                <p className="text-sm opacity-90">{t.analytics.zoneType}</p>
                <p className="text-xl font-bold">{ZONE_LABELS[selectedZone] || selectedZone}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6">
                <div className="text-3xl mb-2">🌾</div>
                <p className="text-sm opacity-90">{t.analytics.cropType}</p>
                <p className="text-sm text-gray-600">{t.analytics.zone}: {selectedZone}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.analytics.noData}</h2>
            <p className="text-gray-600">{t.analytics.selectZonePrompt}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
