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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📈 {t.analytics.title}</h1>
          <p className="text-gray-600">{t.analytics.subtitle}</p>
        </div>

        {/* Zone Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.analytics.selectZone}
          </label>
          <select
            value={selectedZone}
            onChange={handleZoneChange}
            className="w-full md:w-96 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
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
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">{t.analytics.loadingAnalytics}</p>
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
