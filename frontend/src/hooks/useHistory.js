/**
 * useHistory Hook
 * 
 * Fetches historical sensor + weather data for analytics charts.
 * Supports date range filtering and automatic caching.
 * 
 * OFFLINE-FIRST STRATEGY:
 * 1. If ONLINE: Fetch from API → Cache in IndexedDB (last 7 days only) → Return
 * 2. If OFFLINE: Load from IndexedDB → Return cached history
 * 3. Automatically limits cache to 7 days to save storage
 * 
 * This hook powers the Analytics page charts.
 */

import { useState, useEffect, useCallback } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { farmAPI } from '../api/api';
import { saveHistoryData, getHistoryData } from '../offline/db';

export const useHistory = (zoneId, options = {}) => {
  const {
    fromDate = null,
    toDate = null,
    limit = 1000,
  } = options;

  const [data, setData] = useState({ sensor_readings: [], weather: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const { isOnline } = useOfflineStatus();

  const fetchHistory = useCallback(async () => {
    if (!zoneId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // ONLINE: Fetch from API
        console.log(`📡 Fetching history for zone ${zoneId} from API...`);
        
        const apiHistory = await farmAPI.getHistory(
          zoneId,
          fromDate,
          toDate,
          limit
        );
        
        if (apiHistory) {
          // Extract data from response (apiHistory is axios response)
          const historyData = apiHistory.data?.data || apiHistory.data || apiHistory;
          
          // Cache the history data (only last 7 days to save space)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const recentData = {
            sensor_readings: historyData.sensor_readings?.filter(item => 
              new Date(item.timestamp) >= sevenDaysAgo
            ) || [],
            weather: historyData.weather?.filter(item => 
              new Date(item.timestamp) >= sevenDaysAgo
            ) || [],
          };
          
          await saveHistoryData(zoneId, recentData);
          setData(historyData);
          setSource('api');
          console.log(`✅ Loaded history for ${zoneId} from API`);
        } else {
          throw new Error('No history data returned');
        }
      } else {
        // OFFLINE: Load from cache
        console.log(`💾 Loading history for zone ${zoneId} from cache...`);
        const cachedHistory = await getHistoryData(zoneId);
        
        if (cachedHistory && (cachedHistory.sensor_readings?.length > 0 || cachedHistory.weather?.length > 0)) {
          setData(cachedHistory);
          setSource('cache');
          console.log(`✅ Loaded cached history for ${zoneId} (${cachedHistory.sensor_readings?.length || 0} sensor records)`);
        } else {
          throw new Error('No cached history available');
        }
      }
    } catch (err) {
      console.error(`Error loading history for zone ${zoneId}:`, err);
      
      // FALLBACK: Try cache if API fails
      try {
        const cachedHistory = await getHistoryData(zoneId);
        if (cachedHistory && (cachedHistory.sensor_readings?.length > 0 || cachedHistory.weather?.length > 0)) {
          setData(cachedHistory);
          setSource('cache');
          console.log(`⚠️ API failed, using cached history for ${zoneId}`);
          setError('Using cached data - connection issues');
        } else {
          setError(err.message);
          setData({ sensor_readings: [], weather: [] });
        }
      } catch (cacheErr) {
        setError('Unable to load history - no cache available');
        setData({ sensor_readings: [], weather: [] });
      }
    } finally {
      setLoading(false);
    }
  }, [zoneId, fromDate, toDate, limit, isOnline]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const refresh = () => {
    fetchHistory();
  };

  return {
    data,
    loading,
    error,
    source,
    isOnline,
    refresh,
  };
};
