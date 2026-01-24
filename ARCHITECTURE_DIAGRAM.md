# 🏗️ Offline-First Architecture Diagram

## System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER (FARMER)                                  │
│                    Mobile / Desktop Browser                             │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND (PWA)                               │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    UI COMPONENTS                                  │  │
│  │  • ModernDashboard  • Analytics  • Recommendations              │  │
│  │  • ImageAnalysis    • Sensors    • Help                         │  │
│  └─────────────┬────────────────────────────────────────────────────┘  │
│                │                                                         │
│                ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   CUSTOM HOOKS LAYER                             │  │
│  │                                                                  │  │
│  │  useOfflineStatus()  ────► Monitor online/offline state         │  │
│  │  useZones()          ────► Load farm zones (offline-first)      │  │
│  │  useLatestData()     ────► Load sensor data (offline-first)     │  │
│  │  useHistory()        ────► Load analytics (offline-first)       │  │
│  │  useSaveAction()     ────► Save actions with queue              │  │
│  └─────────────┬────────────────────────────────────────────────────┘  │
│                │                                                         │
│                ▼                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              OFFLINE-FIRST LOGIC                                 │  │
│  │                                                                  │  │
│  │  ┌──────────────┐    Check:                ┌──────────────┐    │  │
│  │  │   ONLINE?    │◄── navigator.onLine ────►│  OFFLINE?    │    │  │
│  │  └──────┬───────┘                          └──────┬───────┘    │  │
│  │         │                                          │            │  │
│  │         ▼                                          ▼            │  │
│  │  ┌─────────────┐                          ┌─────────────┐     │  │
│  │  │  Try API    │                          │ Load Cache  │     │  │
│  │  │  Request    │                          │ (IndexedDB) │     │  │
│  │  └──────┬──────┘                          └─────────────┘     │  │
│  │         │                                                       │  │
│  │         ├─── Success ─────► Cache Data ─────────┐             │  │
│  │         │                                        │             │  │
│  │         └─── Failure ────► Load from Cache ─────┤             │  │
│  │                                                  │             │  │
│  │                                                  ▼             │  │
│  │                                          ┌─────────────┐      │  │
│  │                                          │  Return to  │      │  │
│  │                                          │  Component  │      │  │
│  │                                          └─────────────┘      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└───────┬──────────────────────────────────────────────────┬─────────┘
        │                                                   │
        ▼                                                   ▼
┌───────────────────────────┐                  ┌──────────────────────┐
│    INDEXEDDB (LOCAL)      │                  │   FLASK BACKEND      │
│                           │                  │   (REMOTE API)       │
│  ┌─────────────────────┐  │                  │                      │
│  │  zones              │  │                  │  GET  /api/zones     │
│  │  latestData         │  │                  │  GET  /api/latest    │
│  │  historyData        │  │                  │  GET  /api/history   │
│  │  pendingActions     │  │                  │  POST /api/predict   │
│  │  appSettings        │  │                  │  POST /api/actions   │
│  └─────────────────────┘  │                  │                      │
│                           │                  │  ┌────────────────┐  │
│  Storage: 2-3 MB          │                  │  │   MongoDB      │  │
│  Retention: 7-30 days     │                  │  │   Database     │  │
│                           │                  │  └────────────────┘  │
└───────────────────────────┘                  └──────────────────────┘
        │                                                   │
        │                                                   │
        └─────────────► AUTO-SYNC SERVICE ◄────────────────┘
                               │
                     ┌─────────▼──────────┐
                     │  Sync Every 60s    │
                     │  When Online       │
                     └────────────────────┘
```

---

## Data Flow - ONLINE Mode

```
1. User Action (e.g., "Load Dashboard")
         │
         ▼
2. Component calls useZones()
         │
         ▼
3. Hook checks: navigator.onLine === true
         │
         ▼
4. Make API Request: GET /api/zones
         │
         ▼
5. API Success ──────────► Cache in IndexedDB
         │                         │
         ▼                         ▼
6. Return zones ───────►  Display to user
         │
         ▼
7. Show blue badge: "🌐 Online"
```

---

## Data Flow - OFFLINE Mode

```
1. User Action (e.g., "Load Dashboard")
         │
         ▼
2. Component calls useZones()
         │
         ▼
3. Hook checks: navigator.onLine === false
         │
         ▼
4. Skip API ──────► Load from IndexedDB
         │                    │
         │                    ▼
         │           Find cached zones
         │                    │
         ▼                    ▼
5. Return zones ◄───────── Return cached data
         │
         ▼
6. Display to user
         │
         ▼
7. Show orange badge: "📴 Offline Mode"
```

---

## Data Flow - API FAILURE (Fallback)

```
1. User Action (e.g., "Load Dashboard")
         │
         ▼
2. Component calls useZones()
         │
         ▼
3. Hook checks: navigator.onLine === true
         │
         ▼
4. Make API Request: GET /api/zones
         │
         ▼
5. API FAILS (Network Error / Server Down)
         │
         ▼
6. Catch Error ────► Try IndexedDB Cache
         │                    │
         │                    ▼
         │           Find cached zones
         │                    │
         ▼                    ▼
7. Return zones ◄───────── Return cached data
         │
         ▼
8. Display to user
         │
         ▼
9. Show warning: "⚠️ Using cached data"
```

---

## Action Save Flow - ONLINE

```
1. User clicks "Approve Recommendation"
         │
         ▼
2. Component calls saveAction()
         │
         ▼
3. Hook checks: navigator.onLine === true
         │
         ▼
4. Send to API: POST /api/actions
         │
         ▼
5. API Success
         │
         ▼
6. Show success: "✅ Action saved!"
```

---

## Action Save Flow - OFFLINE

```
1. User clicks "Approve Recommendation"
         │
         ▼
2. Component calls saveAction()
         │
         ▼
3. Hook checks: navigator.onLine === false
         │
         ▼
4. Save to IndexedDB.pendingActions
         │                    │
         │                    ▼
         │           Set synced = false
         │                    │
         ▼                    ▼
5. Show message: "✅ Action saved offline"
         │
         ▼
6. Wait for connection...
         │
         ▼
7. Connection restored ──► Auto-sync triggers
         │
         ▼
8. Sync Service ──► POST to /api/actions
         │
         ▼
9. Update IndexedDB: synced = true
         │
         ▼
10. Action synced successfully!
```

---

## Hook Architecture

```
┌─────────────────────────────────────────────────────┐
│                  useOfflineStatus()                  │
│  • Listens to window 'online' / 'offline' events    │
│  • Returns: { isOnline, isOffline }                 │
│  • Updates state in real-time                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼ Used by
         ┌───────────────────────────┐
         │                           │
         ▼                           ▼
┌────────────────┐          ┌────────────────┐
│  useZones()    │          │ useLatestData()│
│  • Load zones  │          │ • Load sensor  │
│  • Cache 7d    │          │ • Cache 7d     │
└────────────────┘          └────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │      useHistory()         │
         │  • Load analytics         │
         │  • Cache 7 days           │
         │  • Filters by date        │
         └───────────────────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │   useSaveAction()         │
         │  • Save actions           │
         │  • Queue offline          │
         │  • Auto-sync              │
         └───────────────────────────┘
```

---

## IndexedDB Structure

```
FarmAiDB (Database)
│
├── zones
│   └── Stores: ['CS1', 'CS2', 'BS1', ...]
│
├── latestData
│   ├── CS1: { sensor: {...}, weather: {...}, cachedAt: '2026-01-24' }
│   ├── CS2: { sensor: {...}, weather: {...}, cachedAt: '2026-01-24' }
│   └── ...
│
├── historyData
│   ├── { id: 1, zone_id: 'CS1', type: 'sensor', timestamp: '...', data: {...} }
│   ├── { id: 2, zone_id: 'CS1', type: 'weather', timestamp: '...', data: {...} }
│   └── ... (7 days retention)
│
├── pendingActions
│   ├── { id: 1, zone_id: 'CS1', synced: false, timestamp: '...', action: {...} }
│   ├── { id: 2, zone_id: 'BS1', synced: true, timestamp: '...', action: {...} }
│   └── ... (30 days for synced, forever for unsynced)
│
└── appSettings
    ├── { key: 'lastSync', value: '2026-01-24T10:30:00' }
    ├── { key: 'theme', value: 'light' }
    └── ...
```

---

## Sync Service Flow

```
┌─────────────────────────────────────────────────────┐
│              Sync Service (sync.js)                  │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌────────────────┐      ┌─────────────────┐
│  Timer Sync    │      │  Event Sync     │
│  Every 60s     │      │  'online' event │
└────────┬───────┘      └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Check: isOnline()?   │
         └───────────┬───────────┘
                     │
                     ▼ YES
         ┌───────────────────────┐
         │  getPendingActions()  │
         │  from IndexedDB       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  For each action:     │
         │  POST /api/actions    │
         └───────────┬───────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌────────────────┐      ┌─────────────────┐
│   Success      │      │    Failure      │
│   Mark synced  │      │    Retry later  │
└────────────────┘      └─────────────────┘
```

---

## Cleanup Service Flow

```
┌─────────────────────────────────────────────────────┐
│            Cleanup Service (db.js)                   │
│                Runs Daily                            │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌────────────────┐      ┌─────────────────┐
│  Cleanup       │      │  Cleanup        │
│  History       │      │  Actions        │
│  > 7 days old  │      │  > 30 days old  │
│                │      │  (synced only)  │
└────────┬───────┘      └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Delete old records   │
         │  from IndexedDB       │
         └───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Log deleted count    │
         │  to console           │
         └───────────────────────┘
```

---

## Component Integration Example

```
┌─────────────────────────────────────────────────────┐
│           ModernDashboard Component                  │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌────────────────┐      ┌─────────────────┐
│  useZones()    │      │ useLatestData() │
│  • zones       │      │ • currentData   │
│  • loading     │      │ • loading       │
│  • source      │      │ • source        │
└────────┬───────┘      └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Render UI           │
         │   • Zone dropdown     │
         │   • Sensor metrics    │
         │   • Status badges     │
         └───────────────────────┘
```

---

**This architecture ensures your FarmAI app works seamlessly both online and offline! 🌾**
