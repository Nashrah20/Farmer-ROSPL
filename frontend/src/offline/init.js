/**
 * OFFLINE-FIRST INITIALIZATION
 * 
 * This file initializes the offline-first architecture on app startup.
 * It sets up:
 * 1. Auto-sync of pending actions when online
 * 2. Daily cleanup of old IndexedDB data
 * 3. Service Worker registration
 * 
 * Import and call initOfflineSystem() in your main.jsx
 */

import { initSync } from './sync';
import { scheduleCleanup } from './db';

export const initOfflineSystem = () => {
  console.log('🚀 Initializing offline-first system...');

  // Start auto-sync for pending actions
  initSync();
  console.log('✅ Auto-sync enabled (checks every 60s)');

  // Schedule daily cleanup
  scheduleCleanup();
  console.log('✅ Daily cleanup scheduled');

  // Log when app goes offline/online
  window.addEventListener('online', () => {
    console.log('✅ Connection restored - app is now ONLINE');
    console.log('🔄 Syncing pending actions...');
  });

  window.addEventListener('offline', () => {
    console.log('❌ Connection lost - switching to OFFLINE mode');
    console.log('💾 Data will be cached and synced when connection returns');
  });

  console.log(`📡 Current status: ${navigator.onLine ? 'ONLINE' : 'OFFLINE'}`);
};

// Usage in main.jsx:
// import { initOfflineSystem } from './offline/init';
// initOfflineSystem();
