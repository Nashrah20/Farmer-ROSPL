# 🌐 Offline-First PWA Architecture

## Overview

This FarmAI dashboard implements a **complete offline-first architecture** using IndexedDB, allowing farmers to access their data even without internet connectivity. Data is automatically cached locally and synced when connection returns.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     REACT APP                        │
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │  Components  │◄────────│  React Hooks │         │
│  └──────────────┘         └──────────────┘         │
│         │                         │                 │
│         │                         ▼                 │
│         │                ┌──────────────┐           │
│         └───────────────►│   IndexedDB  │           │
│                          │    (Dexie)   │           │
│                          └──────────────┘           │
│                                 │                   │
└─────────────────────────────────┼───────────────────┘
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
              ▼ ONLINE                      ▼ OFFLINE
        ┌──────────┐                  ┌──────────┐
        │ Flask API│                  │  Cache   │
        └──────────┘                  └──────────┘
```

---

## 📦 File Structure

```
frontend/src/
├── offline/
│   ├── db.js              # IndexedDB schema & operations
│   ├── sync.js            # Auto-sync pending actions
│   └── init.js            # Initialize offline system
├── hooks/
│   ├── useOfflineStatus.js   # Monitor online/offline state
│   ├── useZones.js           # Load zones (API → cache fallback)
│   ├── useLatestData.js      # Load sensor data (offline-first)
│   └── useHistory.js         # Load analytics data (offline-first)
```

---

## 🔄 How It Works

### 1. **Data Loading Strategy**

#### When ONLINE:
```javascript
1. Fetch data from API (Flask backend)
   ↓
2. Cache in IndexedDB
   ↓
3. Return fresh data to component
```

#### When OFFLINE:
```javascript
1. Load data from IndexedDB cache
   ↓
2. Display with "📴 Offline Mode" badge
   ↓
3. Queue actions for later sync
```

#### When API Fails (but "online"):
```javascript
1. Try API request
   ↓
2. Catch error → fallback to IndexedDB
   ↓
3. Show "Using cached data" message
```

---

### 2. **IndexedDB Schema**

```javascript
// Database: FarmAiDB (Version 1)

zones:
  - id (primary key)

latestData:
  - zone_id (primary key)
  - data (JSON object: sensor + weather)
  - cachedAt (ISO timestamp)

historyData:
  - id (auto-increment)
  - zone_id (indexed)
  - type ('sensor' or 'weather')
  - timestamp (indexed)
  - data (JSON object)

pendingActions:
  - id (auto-increment)
  - zone_id
  - timestamp
  - synced (boolean)
  - action data (irrigation, fertilizer, etc.)

appSettings:
  - key (primary key)
  - value (any)
```

---

### 3. **React Hooks Usage**

#### **useOfflineStatus()**
Monitor connectivity in real-time.

```jsx
import { useOfflineStatus } from '../hooks/useOfflineStatus';

const MyComponent = () => {
  const { isOnline, isOffline } = useOfflineStatus();
  
  return (
    <div>
      {isOffline && <div>📴 Offline Mode</div>}
      {isOnline && <div>🌐 Online</div>}
    </div>
  );
};
```

#### **useZones()**
Load farm zones with automatic cache fallback.

```jsx
import { useZones } from '../hooks/useZones';

const Dashboard = () => {
  const { zones, loading, error, source, isOnline } = useZones();
  
  // zones: Array of zone IDs
  // source: 'api' or 'cache'
  
  return (
    <select>
      {zones.map(zone => (
        <option key={zone} value={zone}>{zone}</option>
      ))}
    </select>
  );
};
```

#### **useLatestData(zoneId)**
Load latest sensor + weather data.

```jsx
import { useLatestData } from '../hooks/useLatestData';

const SensorDisplay = ({ zoneId }) => {
  const { 
    data,           // Latest sensor + weather data
    loading,        // Loading state
    error,          // Error message (if any)
    source,         // 'api' or 'cache'
    cachedAt,       // When data was cached
    refresh         // Manual refresh function
  } = useLatestData(zoneId);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Temperature: {data.sensor?.temperature}°C</p>
      <p>Humidity: {data.sensor?.humidity}%</p>
      {source === 'cache' && <p>⚠️ Showing cached data</p>}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
};
```

#### **useHistory(zoneId, options)**
Load historical data for charts.

```jsx
import { useHistory } from '../hooks/useHistory';

const Analytics = ({ zoneId }) => {
  const {
    data,           // { sensor_readings: [], weather: [] }
    loading,
    error,
    source,
    refresh
  } = useHistory(zoneId, {
    fromDate: '2026-01-01',  // Optional
    toDate: '2026-01-24',    // Optional
    limit: 1000              // Max records
  });
  
  // Use data.sensor_readings for charts
  return <Chart data={data.sensor_readings} />;
};
```

---

### 4. **Pending Actions Sync**

When a user takes an action (e.g., "Approve Recommendation") while offline:

```jsx
import { savePendingAction } from '../offline/db';

const saveAction = async () => {
  const action = {
    zone_id: 'CS1',
    irrigation_liters: 25.5,
    fertilizer_N_g: 15.2,
    fertilizer_P_g: 2.5,
    fertilizer_K_g: 5.0,
  };
  
  // Save to IndexedDB with synced=false
  await savePendingAction(action);
  
  // Auto-sync when connection returns (handled by sync.js)
};
```

**Auto-sync workflow:**
1. Action saved to IndexedDB (synced=false)
2. App monitors connection status
3. When online, auto-sends action to POST /api/actions
4. On success, marks action as synced=true
5. Retries failed syncs every 60 seconds

---

### 5. **Auto-Cleanup**

**Old data is automatically deleted:**
- History data older than **7 days** (runs daily)
- Synced actions older than **30 days** (runs daily)

```javascript
// Configured in: src/offline/db.js

scheduleCleanup(); // Runs every 24 hours
```

---

## 🚀 Initialization

The offline system initializes automatically when the app starts:

```jsx
// src/main.jsx

import { initOfflineSystem } from './offline/init';

// Initialize on app startup
initOfflineSystem();
```

This sets up:
- ✅ Auto-sync (checks every 60 seconds)
- ✅ Daily cleanup
- ✅ Connection status logging

---

## 🎨 UI Indicators

### **Navbar Badge**
Shows current connection status:
- 🌐 **Online** - Blue badge, "Live data sync"
- 📴 **Offline Mode** - Orange badge, "Using cached data"

Located in both desktop sidebar and mobile menu.

---

## 📊 Data Flow Examples

### Example 1: Loading Dashboard (Online)

```
1. User opens dashboard
   ↓
2. useZones() hook:
   - Calls GET /api/zones
   - Saves to IndexedDB.zones
   - Returns zones to component
   ↓
3. User selects "CS1"
   ↓
4. useLatestData('CS1') hook:
   - Calls GET /api/latest?zone_id=CS1
   - Saves to IndexedDB.latestData
   - Returns sensor + weather data
   ↓
5. Dashboard displays real-time metrics
```

### Example 2: Loading Dashboard (Offline)

```
1. User opens dashboard
   ↓
2. useZones() hook:
   - Detects offline status
   - Loads from IndexedDB.zones
   - Returns cached zones
   ↓
3. User selects "CS1"
   ↓
4. useLatestData('CS1') hook:
   - Detects offline status
   - Loads from IndexedDB.latestData
   - Returns cached sensor + weather data
   ↓
5. Dashboard displays cached metrics
6. Orange badge shows "📴 Offline Mode"
```

### Example 3: API Fails but Browser Says "Online"

```
1. User opens dashboard
   ↓
2. useZones() hook:
   - Tries GET /api/zones → Network Error
   - Catches error → fallback to IndexedDB
   - Returns cached zones
   - Sets error: "Using cached data - connection issues"
   ↓
3. UI shows warning message
4. User can still use the app
```

---

## 🔧 Backend Requirements

### API Endpoints

The offline system expects these endpoints:

```
GET  /api/zones               → Returns list of zone IDs
GET  /api/latest?zone_id=X    → Returns sensor + weather data
GET  /api/history?zone_id=X&from=&to=&limit=  → Returns historical data
POST /api/actions             → Saves pending actions
POST /api/predict             → AI recommendations
```

### CORS Settings

Ensure Flask backend allows cross-origin requests:

```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

---

## 🧪 Testing Offline Mode

### Chrome DevTools Method:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Select **Offline** from throttling dropdown
4. Reload page → App uses cached data

### Manual Test:
1. Turn off WiFi
2. Open app → Zones and data load from cache
3. Orange "📴 Offline Mode" badge appears
4. Turn WiFi back on → Badge changes to "🌐 Online"

---

## 📝 Key Benefits

✅ **Works Offline** - Farmers can view data without internet
✅ **Auto-Sync** - Pending actions sync automatically
✅ **Resilient** - App never crashes if API fails
✅ **Fast** - Cached data loads instantly
✅ **Storage-Efficient** - Auto-cleanup after 7 days
✅ **User-Friendly** - Clear offline indicators

---

## 🐛 Troubleshooting

### Issue: IndexedDB not working

**Solution:** Check browser support
```javascript
if (!('indexedDB' in window)) {
  alert('Your browser does not support IndexedDB');
}
```

### Issue: Data not syncing

**Solution:** Check browser console
```javascript
// Look for these logs:
"✅ Synced 3/3 pending actions"
"❌ Failed to sync action: Network error"
```

### Issue: Old data not cleaning up

**Solution:** Manually trigger cleanup
```javascript
import { runCleanupTasks } from './offline/db';
await runCleanupTasks();
```

---

## 📚 Further Reading

- [IndexedDB API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Dexie.js Documentation](https://dexie.org/)
- [PWA Best Practices](https://web.dev/pwa/)
- [Offline-First Design Patterns](https://alistapart.com/article/offline-first/)

---

## 💡 Future Enhancements

- [ ] Add background sync API for better mobile support
- [ ] Implement conflict resolution for simultaneous edits
- [ ] Add data compression for larger datasets
- [ ] Support full CRUD operations offline
- [ ] Add user preferences caching

---

**Built with ❤️ for farmers | Powered by React + IndexedDB + Dexie.js**
