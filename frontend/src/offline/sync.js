import { farmAPI } from '../api/api';
import { getPendingActions, markActionSynced } from './db';

// Check if online
export const isOnline = () => navigator.onLine;

// Sync pending actions to backend
export const syncPendingActions = async () => {
  if (!isOnline()) {
    console.log('Offline - cannot sync actions');
    return { success: false, message: 'Offline' };
  }

  try {
    const pendingActions = await getPendingActions();

    if (pendingActions.length === 0) {
      console.log('No pending actions to sync');
      return { success: true, synced: 0 };
    }

    console.log(`Syncing ${pendingActions.length} pending actions...`);

    let syncedCount = 0;
    const errors = [];

    for (const action of pendingActions) {
      try {
        // Remove internal fields before sending
        const { id, synced, ...actionData } = action;

        await farmAPI.saveAction(actionData);
        await markActionSynced(id);
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        errors.push({ actionId: action.id, error: error.message });
      }
    }

    console.log(`Synced ${syncedCount}/${pendingActions.length} actions`);

    return {
      success: true,
      synced: syncedCount,
      total: pendingActions.length,
      errors,
    };
  } catch (error) {
    console.error('Error syncing actions:', error);
    return { success: false, error: error.message };
  }
};

// Auto-sync when coming back online
let syncInterval = null;

export const startAutoSync = (intervalMs = 60000) => {
  // Sync immediately if online
  if (isOnline()) {
    syncPendingActions();
  }

  // Set up periodic sync
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    if (isOnline()) {
      syncPendingActions();
    }
  }, intervalMs);

  // Listen for online event
  window.addEventListener('online', handleOnline);
};

const handleOnline = () => {
  console.log('Back online - syncing pending actions...');
  syncPendingActions();
};

export const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  window.removeEventListener('online', handleOnline);
};

// Initialize sync on app load
export const initSync = () => {
  startAutoSync(60000); // Sync every minute
};
