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
  const { t } = useLanguage();
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
                  {ZONE_LABELS[zone] || zone}
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
