/**
 * useLatestData Hook
 * 
 * Fetches the latest sensor + weather data for a specific zone.
 * 
 * OFFLINE-FIRST STRATEGY:
 * 1. If ONLINE: Fetch from API → Cache in IndexedDB → Return fresh data
 * 2. If OFFLINE: Load from IndexedDB → Return cached data with timestamp
 * 3. On API error: Fallback to cache automatically
 * 
 * The hook includes a refresh() function to manually refetch data.
 */

import { useState, useEffect, useCallback } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { farmAPI } from '../api/api';
import { saveLatestData, getLatestData } from '../offline/db';

export const useLatestData = (zoneId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null); // 'api' or 'cache'
  const [cachedAt, setCachedAt] = useState(null);
  const { isOnline } = useOfflineStatus();

  const fetchData = useCallback(async () => {
    if (!zoneId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // ONLINE: Fetch from API
        console.log(`📡 Fetching latest data for zone ${zoneId} from API...`);
        const response = await farmAPI.getLatest(zoneId);
        const apiData = response.data?.data || response.data;
        
        if (apiData) {
          // Cache the fresh data
          await saveLatestData(zoneId, apiData);
          setData(apiData);
          setSource('api');
          setCachedAt(new Date().toISOString());
          console.log(`✅ Loaded latest data for ${zoneId} from API`);
        } else {
          throw new Error('No data returned from API');
        }
      } else {
        // OFFLINE: Load from cache
        console.log(`💾 Loading latest data for zone ${zoneId} from cache...`);
        const cached = await getLatestData(zoneId);
        
        if (cached) {
          setData(cached);
          setSource('cache');
          setCachedAt(cached.cachedAt || 'unknown');
          console.log(`✅ Loaded cached data for ${zoneId}`);
        } else {
          throw new Error('No cached data available for this zone');
        }
      }
    } catch (err) {
      console.error(`Error loading data for zone ${zoneId}:`, err);
      
      // FALLBACK: Try cache if API fails
      try {
        const cached = await getLatestData(zoneId);
        if (cached) {
          setData(cached);
          setSource('cache');
          setCachedAt(cached.cachedAt || 'unknown');
          console.log(`⚠️ API failed, using cached data for ${zoneId}`);
          setError('Using cached data - connection issues');
        } else {
          setError(err.message);
        }
      } catch (cacheErr) {
        setError('Unable to load data - no cache available');
      }
    } finally {
      setLoading(false);
    }
  }, [zoneId, isOnline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manual refresh function
  const refresh = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    source,
    cachedAt,
    isOnline,
    refresh,
  };
};
