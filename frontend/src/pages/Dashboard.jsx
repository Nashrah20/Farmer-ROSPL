import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api/api';

// Zone display name mapping
const ZONE_LABELS = {
  'CS1': '🌾 Coarse - Groundnut', 'CS2': '🌾 Coarse - Bajra', 'CS3': '🍉 Coarse - Watermelon',
  'BS1': '🌿 Black - Cotton', 'BS2': '🌱 Black - Soybean', 'BS3': '🌾 Black - Jowar',
  'LS1': '🌰 Laterite - Cashew', 'LS2': '🥥 Laterite - Coconut', 'LS3': '🌾 Laterite - Rice',
  'AS1': '🍬 Alluvial - Sugarcane', 'AS2': '🌾 Alluvial - Wheat', 'AS3': '🍌 Alluvial - Banana',
  'YS1': '🌾 Yellow-Brown - Rice', 'YS2': '🌾 Yellow-Brown - Ragi', 'YS3': '🌾 Yellow-Brown - Tur',
};
import {
  saveZones,
  getZones,
  saveLatestData,
  getLatestData,
  saveHistoryData,
  getHistoryData,
  savePendingAction,
} from '../offline/db';
import { initSync, isOnline, syncPendingActions } from '../offline/sync';
import ZoneDropdown from '../components/ZoneDropdown';
import StatCard from '../components/StatCard';
import ChartsPanel from '../components/ChartsPanel';
import RecommendationCard from '../components/RecommendationCard';

const Dashboard = () => {
  // Helper functions
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toFixed(decimals);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // State management
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);

  // Loading states
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [approving, setApproving] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Initialize app
  useEffect(() => {
    initializeApp();
    initSync(); // Start auto-sync

    // Listen for online/offline events
    const handleOnlineStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Fetch zones on mount
  const initializeApp = async () => {
    setLoadingZones(true);
    setError(null);

    try {
      if (isOnline()) {
        // Fetch from API
        const response = await farmAPI.getZones();
        const fetchedZones = response.data.zones;
        setZones(fetchedZones);
        await saveZones(fetchedZones);
      } else {
        // Load from IndexedDB
        const cachedZones = await getZones();
        if (cachedZones.length > 0) {
          setZones(cachedZones);
        } else {
          setError('No cached data available. Please connect to internet.');
        }
      }
    } catch (err) {
      console.error('Error loading zones:', err);
      // Try loading from cache
      const cachedZones = await getZones();
      if (cachedZones.length > 0) {
        setZones(cachedZones);
        setError('Using cached data (offline)');
      } else {
        setError('Failed to load zones. Please check your connection.');
      }
    } finally {
      setLoadingZones(false);
    }
  };

  // Handle zone selection
  const handleZoneChange = async (zoneId) => {
    setSelectedZone(zoneId);
    setPrediction(null); // Clear previous prediction

    if (!zoneId) {
      setLatestData(null);
      setHistoryData(null);
      return;
    }

    setLoadingData(true);
    setError(null);

    try {
      // Fetch latest data
      if (isOnline()) {
        const latestResponse = await farmAPI.getLatest(zoneId);
        const latest = latestResponse.data.data;
        setLatestData(latest);
        await saveLatestData(zoneId, latest);

        // Fetch history (last 7 days)
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 7);

        const historyResponse = await farmAPI.getHistory(
          zoneId,
          fromDate.toISOString(),
          toDate.toISOString(),
          100
        );
        const history = historyResponse.data.history;
        setHistoryData(history);
        await saveHistoryData(zoneId, history);
      } else {
        // Load from IndexedDB
        const cachedLatest = await getLatestData(zoneId);
        const cachedHistory = await getHistoryData(zoneId);

        if (cachedLatest) {
          setLatestData(cachedLatest);
        }
        if (cachedHistory) {
          setHistoryData(cachedHistory);
        }

        if (!cachedLatest && !cachedHistory) {
          setError('No cached data for this zone. Connect to internet to fetch data.');
        }
      }
    } catch (err) {
      console.error('Error loading zone data:', err);
      // Try loading from cache
      const cachedLatest = await getLatestData(zoneId);
      const cachedHistory = await getHistoryData(zoneId);

      if (cachedLatest || cachedHistory) {
        setLatestData(cachedLatest);
        setHistoryData(cachedHistory);
        setError('Using cached data (offline)');
      } else {
        setError('Failed to load zone data');
      }
    } finally {
      setLoadingData(false);
    }
  };

  // Get recommendation
  const handleGetRecommendation = async () => {
    if (!selectedZone) {
      setError('Please select a zone first');
      return;
    }

    if (!isOnline()) {
      setError('Predictions require internet connection');
      return;
    }

    setPredicting(true);
    setError(null);

    try {
      const response = await farmAPI.predict(selectedZone);
      setPrediction(response.data.prediction);
    } catch (err) {
      console.error('Error getting prediction:', err);
      setError(
        err.response?.data?.error ||
          'Failed to get recommendation. Make sure the model is trained.'
      );
    } finally {
      setPredicting(false);
    }
  };

  // Approve action
  const handleApproveAction = async () => {
    if (!prediction) return;

    setApproving(true);
    setError(null);

    const actionData = {
      zone_id: selectedZone,
      timestamp: new Date().toISOString(),
      irrigation_liters: prediction.predictions.irrigation_liters,
      fertilizer_N_g: prediction.predictions.fertilizer_N_g,
      fertilizer_P_g: prediction.predictions.fertilizer_P_g,
      fertilizer_K_g: prediction.predictions.fertilizer_K_g,
      model_used: prediction.model_used,
      explanation: prediction.explanation,
    };

    try {
      if (isOnline()) {
        await farmAPI.saveAction(actionData);
        alert('✓ Action approved and saved successfully!');
      } else {
        await savePendingAction(actionData);
        alert('✓ Action saved offline. Will sync when online.');
      }
    } catch (err) {
      console.error('Error saving action:', err);
      // Save to pending queue on error
      await savePendingAction(actionData);
      alert('✓ Action saved to pending queue. Will sync when connection is restored.');
    } finally {
      setApproving(false);
    }
  };

  // Extract sensor and weather data
  const sensorData = latestData?.sensor || {};
  const weatherData = latestData?.weather || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">🌾 Farm AI</h1>
              <p className="text-sm opacity-90">Autonomous Recommendation System</p>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  online ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {online ? '● Online' : '● Offline'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <p className="text-yellow-700">⚠️ {error}</p>
          </div>
        )}

        {/* Zone Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <ZoneDropdown
            zones={zones}
            selectedZone={selectedZone}
            onZoneChange={handleZoneChange}
            loading={loadingZones || loadingData}
          />
        </div>

        {selectedZone && latestData && (
          <>
            {/* Current Conditions */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">📊 Current Conditions</h2>
                {(sensorData.timestamp || weatherData.timestamp) && (
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <span className="text-xs text-gray-600">Last Updated: </span>
                    <span className="text-xs font-semibold text-gray-800">
                      {formatTimestamp(sensorData.timestamp || weatherData.timestamp)}
                    </span>
                  </div>
                )}
              </div>

              {/* Soil Metrics */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Soil Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <StatCard
                    title="Moisture"
                    value={formatNumber(sensorData.soil_moisture, 2)}
                    unit="%"
                    icon="💧"
                    color="blue"
                  />
                  <StatCard
                    title="Nitrogen (N)"
                    value={formatNumber(sensorData.nitrogen, 2)}
                    unit="mg/kg"
                    icon="🔵"
                    color="blue"
                  />
                  <StatCard
                    title="Phosphorus (P)"
                    value={formatNumber(sensorData.phosphorus, 2)}
                    unit="mg/kg"
                    icon="🟡"
                    color="yellow"
                  />
                  <StatCard
                    title="Potassium (K)"
                    value={formatNumber(sensorData.potassium, 2)}
                    unit="mg/kg"
                    icon="🟣"
                    color="purple"
                  />
                  <StatCard
                    title="pH Level"
                    value={formatNumber(sensorData.ph, 2)}
                    icon="⚗️"
                    color="green"
                  />
                </div>
              </div>

              {/* Plant Health */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Plant Health</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard
                    title="NDVI"
                    value={formatNumber(sensorData.NDVI, 2)}
                    icon="🌱"
                    color="green"
                  />
                  <StatCard
                    title="Stress Level"
                    value={formatNumber(sensorData.stress_level, 2)}
                    unit="/10"
                    icon="⚠️"
                    color={sensorData.stress_level > 5 ? 'red' : 'green'}
                  />
                  <StatCard
                    title="EC"
                    value={formatNumber(sensorData.EC_ds_m, 2)}
                    unit="dS/m"
                    icon="⚡"
                    color="primary"
                  />
                </div>
              </div>

              {/* Weather */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Weather</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    title="Temperature"
                    value={formatNumber(weatherData.temperature, 1)}
                    unit="°C"
                    icon="🌡️"
                    color="red"
                  />
                  <StatCard
                    title="Humidity"
                    value={formatNumber(weatherData.humidity, 0)}
                    unit="%"
                    icon="💨"
                    color="blue"
                  />
                  <StatCard
                    title="Wind Speed"
                    value={formatNumber(weatherData.wind_kmph, 1)}
                    unit="km/h"
                    icon="🌪️"
                    color="primary"
                  />
                  <StatCard
                    title="Rainfall"
                    value={formatNumber(weatherData.rainfall_mm, 1)}
                    unit="mm"
                    icon="🌧️"
                    color="blue"
                  />
                </div>
              </div>
            </div>

            {/* Charts */}
            {historyData && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Historical Trends</h2>
                <ChartsPanel historyData={historyData} />
              </div>
            )}

            {/* Recommendation Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">🤖 AI Recommendation</h2>
                <button
                  onClick={handleGetRecommendation}
                  disabled={predicting || !online}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {predicting ? (
                    <>
                      <span className="loading mr-2"></span>
                      Getting Recommendation...
                    </>
                  ) : (
                    'Get Recommendation'
                  )}
                </button>
              </div>
              <RecommendationCard
                prediction={prediction}
                onApprove={handleApproveAction}
                approving={approving}
              />
            </div>
          </>
        )}

        {/* Empty State */}
        {!selectedZone && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🌾</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Farm AI</h2>
            <p className="text-gray-600">
              Select a farm zone above to view real-time data and get AI-powered recommendations
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2026 Farm AI - Powered by Machine Learning & IoT Sensors
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Built with React, Flask, MongoDB, and scikit-learn
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
