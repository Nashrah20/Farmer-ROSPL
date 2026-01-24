/**
 * useZones Hook
 * 
 * OFFLINE-FIRST STRATEGY:
 * 1. If ONLINE: Fetch zones from API → Cache in IndexedDB → Return zones
 * 2. If OFFLINE: Load zones from IndexedDB → Return cached zones
 * 3. On error: Always fallback to IndexedDB cache
 * 
 * This ensures the app always displays zones, even without internet.
 */

import { useState, useEffect } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { farmAPI } from '../api/api';
import { saveZones, getZones } from '../offline/db';

export const useZones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null); // 'api' or 'cache'
  const { isOnline } = useOfflineStatus();

  useEffect(() => {
    const loadZones = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isOnline) {
          // ONLINE: Fetch from API and cache
          console.log('📡 Fetching zones from API...');
          const response = await farmAPI.getZones();
          const apiZones = response.data?.zones || response.data || [];
          
          if (apiZones && apiZones.length > 0) {
            await saveZones(apiZones);
            setZones(apiZones);
            setSource('api');
            console.log(`✅ Loaded ${apiZones.length} zones from API`);
          } else {
            throw new Error('No zones returned from API');
          }
        } else {
          // OFFLINE: Load from cache
          console.log('💾 Loading zones from IndexedDB cache...');
          const cachedZones = await getZones();
          
          if (cachedZones && cachedZones.length > 0) {
            setZones(cachedZones);
            setSource('cache');
            console.log(`✅ Loaded ${cachedZones.length} zones from cache`);
          } else {
            throw new Error('No cached zones available');
          }
        }
      } catch (err) {
        console.error('Error loading zones:', err);
        
        // FALLBACK: Try cache even if we're "online" but API failed
        try {
          const cachedZones = await getZones();
          if (cachedZones && cachedZones.length > 0) {
            setZones(cachedZones);
            setSource('cache');
            console.log(`⚠️ API failed, using ${cachedZones.length} cached zones`);
            setError('Using cached data - connection issues');
          } else {
            setError(err.message);
          }
        } catch (cacheErr) {
          setError('Unable to load zones - no cache available');
        }
      } finally {
        setLoading(false);
      }
    };

    loadZones();
  }, [isOnline]);

  return { zones, loading, error, source, isOnline };
};
