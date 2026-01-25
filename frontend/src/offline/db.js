import Dexie from 'dexie';

// Initialize IndexedDB database
export const db = new Dexie('FarmAiDB');

// Define database schema
db.version(1).stores({
  zones: 'id',
  latestData: 'zone_id',
  historyData: '++id, zone_id, timestamp',
  pendingActions: '++id, zone_id, timestamp, synced',
  appSettings: 'key',
});

// Helper functions

// Save zones list
export const saveZones = async (zones) => {
  try {
    await db.zones.clear();
    await db.zones.bulkAdd(zones.map((z) => ({ id: z })));
    console.log('Zones saved to IndexedDB');
  } catch (error) {
    console.error('Error saving zones:', error);
  }
};

// Get zones list
export const getZones = async () => {
  try {
    const zones = await db.zones.toArray();
    return zones.map((z) => z.id);
  } catch (error) {
    console.error('Error getting zones:', error);
    return [];
  }
};

// Save latest data for a zone
export const saveLatestData = async (zoneId, data) => {
  try {
    await db.latestData.put({
      zone_id: zoneId,
      data,
      cachedAt: new Date().toISOString(),
    });
    console.log(`Latest data saved for zone ${zoneId}`);
  } catch (error) {
    console.error('Error saving latest data:', error);
  }
};

// Get latest data for a zone
export const getLatestData = async (zoneId) => {
  try {
    const record = await db.latestData.get(zoneId);
    return record ? record.data : null;
  } catch (error) {
    console.error('Error getting latest data:', error);
    return null;
  }
};

// Save history data
export const saveHistoryData = async (zoneId, historyData) => {
  try {
    // Clear old history for this zone
    await db.historyData.where('zone_id').equals(zoneId).delete();

    // Save sensor readings
    if (historyData.sensor_readings) {
      const sensorRecords = historyData.sensor_readings.map((item) => ({
        zone_id: zoneId,
        type: 'sensor',
        timestamp: item.timestamp,
        data: item,
      }));
      await db.historyData.bulkAdd(sensorRecords);
    }

    // Save weather data
    if (historyData.weather) {
      const weatherRecords = historyData.weather.map((item) => ({
        zone_id: zoneId,
        type: 'weather',
        timestamp: item.timestamp,
        data: item,
      }));
      await db.historyData.bulkAdd(weatherRecords);
    }

    console.log(`History data saved for zone ${zoneId}`);
  } catch (error) {
    console.error('Error saving history data:', error);
  }
};

// Get history data
export const getHistoryData = async (zoneId) => {
  try {
    const records = await db.historyData.where('zone_id').equals(zoneId).toArray();

    const sensorReadings = records
      .filter((r) => r.type === 'sensor')
      .map((r) => r.data);

    const weather = records
      .filter((r) => r.type === 'weather')
      .map((r) => r.data);

    return { sensor_readings: sensorReadings, weather };
  } catch (error) {
    console.error('Error getting history data:', error);
    return { sensor_readings: [], weather: [] };
  }
};

// Save pending action
export const savePendingAction = async (actionData) => {
  try {
    await db.pendingActions.add({
      ...actionData,
      timestamp: new Date().toISOString(),
      synced: 0, // Use 0 instead of false for IndexedDB compatibility
    });
    console.log('Pending action saved');
  } catch (error) {
    console.error('Error saving pending action:', error);
  }
};

// Get pending actions
export const getPendingActions = async () => {
  try {
    // Fix: Use numeric value 0 instead of boolean false for IndexedDB query
    return await db.pendingActions.where('synced').equals(0).toArray();
  } catch (error) {
    console.error('Error getting pending actions:', error);
    return [];
  }
};

// Mark action as synced
export const markActionSynced = async (actionId) => {
  try {
    await db.pendingActions.update(actionId, { synced: 1 }); // Use 1 instead of true
  } catch (error) {
    console.error('Error marking action as synced:', error);
  }
};

// Save app setting
export const saveSetting = async (key, value) => {
  try {
    await db.appSettings.put({ key, value });
  } catch (error) {
    console.error('Error saving setting:', error);
  }
};

// Get app setting
export const getSetting = async (key) => {
  try {
    const record = await db.appSettings.get(key);
    return record ? record.value : null;
  } catch (error) {
    console.error('Error getting setting:', error);
    return null;
  }
};

// Auto-cleanup old history data (keep only last 7 days)
export const cleanupOldHistory = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    const deletedCount = await db.historyData
      .where('timestamp')
      .below(cutoffDate)
      .delete();

    console.log(`Cleaned up ${deletedCount} old history records`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up history:', error);
    return 0;
  }
};

// Delete synced actions older than 30 days
export const cleanupSyncedActions = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    const deletedCount = await db.pendingActions
      .where('synced')
      .equals(true)
      .and(item => item.timestamp < cutoffDate)
      .delete();

    console.log(`Cleaned up ${deletedCount} old synced actions`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up synced actions:', error);
    return 0;
  }
};

// Run all cleanup tasks
export const runCleanupTasks = async () => {
  console.log('Running IndexedDB cleanup tasks...');
  const historyDeleted = await cleanupOldHistory();
  const actionsDeleted = await cleanupSyncedActions();
  return { historyDeleted, actionsDeleted };
};

// Schedule daily cleanup (call this on app init)
export const scheduleCleanup = () => {
  // Run cleanup once per day
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  // Run immediately on first load
  runCleanupTasks();
  
  // Then schedule daily
  setInterval(runCleanupTasks, TWENTY_FOUR_HOURS);
};

export default db;
