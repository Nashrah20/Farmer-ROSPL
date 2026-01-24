/**
 * useOfflineStatus Hook
 * 
 * Monitors the browser's online/offline status in real-time.
 * Returns { isOnline, isOffline } with automatic updates when connection changes.
 * 
 * OFFLINE-FIRST ARCHITECTURE:
 * This hook is the foundation of offline detection. All data-fetching hooks
 * use this to decide whether to hit the API or fall back to IndexedDB.
 */

import { useState, useEffect } from 'react';

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Connection restored - switching to online mode');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('❌ Connection lost - switching to offline mode');
      setIsOnline(false);
    };

    // Listen for connectivity changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
};
