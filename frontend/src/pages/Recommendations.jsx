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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🤖 {t.recommendations.title}</h1>
          <p className="text-gray-600">{t.recommendations.subtitle}</p>
        </div>

        {/* Zone Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              {t.recommendations.selectZone}
            </label>
            <button
              onClick={refreshZones}
              disabled={refreshing}
              className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {refreshing ? `🔄 ${t.recommendations.refreshing}` : `🔄 ${t.recommendations.refreshZones}`}
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
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
