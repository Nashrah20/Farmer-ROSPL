/**
 * useSaveAction Hook
 * 
 * Saves farmer actions (irrigation, fertilizer application) with offline support.
 * 
 * OFFLINE-FIRST STRATEGY:
 * 1. If ONLINE: Send action to API → Success
 * 2. If OFFLINE: Save to IndexedDB → Will sync when connection returns
 * 3. On API error: Save to IndexedDB → Retry later
 * 
 * This ensures farmers never lose their decisions, even without internet.
 */

import { useState } from 'react';
import { useOfflineStatus } from './useOfflineStatus';
import { farmAPI } from '../api/api';
import { savePendingAction } from '../offline/db';
import { syncPendingActions } from '../offline/sync';

export const useSaveAction = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { isOnline, isOffline } = useOfflineStatus();

  /**
   * Save an action (irrigation, fertilizer, etc.)
   * @param {Object} actionData - Action details
   * @param {string} actionData.zone_id - Farm zone ID
   * @param {number} actionData.irrigation_liters - Irrigation amount
   * @param {number} actionData.fertilizer_N_g - Nitrogen amount
   * @param {number} actionData.fertilizer_P_g - Phosphorus amount
   * @param {number} actionData.fertilizer_K_g - Potassium amount
   * @returns {Promise<Object>} Result with success status
   */
  const saveAction = async (actionData) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (isOffline) {
        // OFFLINE: Save to IndexedDB for later sync
        console.log('📴 Offline - saving action to IndexedDB...');
        await savePendingAction(actionData);
        
        setSuccess(true);
        console.log('✅ Action saved offline, will sync when connection returns');
        
        return {
          success: true,
          message: 'Action saved offline. Will sync when connection returns.',
          mode: 'offline',
        };
      } else {
        // ONLINE: Send to API
        console.log('📡 Online - sending action to API...');
        const response = await farmAPI.saveAction(actionData);
        
        setSuccess(true);
        console.log('✅ Action saved successfully to backend');
        
        return {
          success: true,
          message: 'Action saved successfully!',
          mode: 'online',
          data: response.data,
        };
      }
    } catch (err) {
      console.error('Error saving action:', err);
      
      // FALLBACK: If API fails, save offline
      try {
        console.log('⚠️ API failed, saving action offline...');
        await savePendingAction(actionData);
        
        setSuccess(true);
        setError('Action saved offline due to connection issues');
        
        return {
          success: true,
          message: 'Action saved offline due to connection issues. Will retry sync.',
          mode: 'offline-fallback',
        };
      } catch (offlineErr) {
        setError('Failed to save action - please try again');
        
        return {
          success: false,
          message: 'Failed to save action',
          error: offlineErr.message,
        };
      }
    } finally {
      setSaving(false);
    }
  };

  /**
   * Manually trigger sync of pending actions
   * Useful for "Retry" buttons
   */
  const syncNow = async () => {
    if (isOffline) {
      setError('Cannot sync while offline');
      return { success: false, message: 'Cannot sync while offline' };
    }

    try {
      console.log('🔄 Manually syncing pending actions...');
      const result = await syncPendingActions();
      
      if (result.success) {
        console.log(`✅ Synced ${result.synced} pending actions`);
        return {
          success: true,
          synced: result.synced,
          message: `Successfully synced ${result.synced} action(s)`,
        };
      } else {
        setError(result.message || 'Sync failed');
        return result;
      }
    } catch (err) {
      setError('Sync failed - will retry automatically');
      return { success: false, error: err.message };
    }
  };

  return {
    saveAction,
    syncNow,
    saving,
    error,
    success,
    isOnline,
    isOffline,
  };
};
