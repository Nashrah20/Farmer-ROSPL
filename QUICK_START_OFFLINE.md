# 🚀 Quick Start Guide - Offline-First PWA

## ⚡ TL;DR - What Changed?

Your FarmAI app now works **completely offline**! All data is cached locally and syncs automatically when internet returns.

---

## 🎯 Key Changes

### 1. **Automatic Data Caching**
- All zones, sensor data, and history are cached in IndexedDB
- App loads data from cache if API is unavailable
- No code changes needed in most components

### 2. **New Offline Indicator**
- **Blue badge** 🌐 = Online (live data)
- **Orange badge** 📴 = Offline (cached data)
- Located in navbar (desktop sidebar + mobile menu)

### 3. **Automatic Sync**
- Actions saved offline queue for sync
- Syncs every 60 seconds
- Syncs immediately when connection returns

---

## 📝 How to Test

### Test 1: Basic Offline Mode

1. **Start the app:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open in browser:** `http://localhost:3001`

3. **Turn on offline mode:**
   - Open DevTools (F12)
   - Go to Network tab
   - Select "Offline" from dropdown

4. **Reload page** → Data loads from cache!
   - Zones display correctly
   - Latest sensor data shows
   - Orange "📴 Offline Mode" badge appears

5. **Turn back online** → Badge changes to blue "🌐 Online"

---

### Test 2: Action Queuing

1. Go offline (DevTools → Network → Offline)

2. Select a zone and click "Get AI Recommendations"

3. Click "Approve" → Action saves to IndexedDB

4. Go back online → Action syncs automatically!

5. Check console logs:
   ```
   📴 Offline - saving action to IndexedDB...
   ✅ Action saved offline, will sync when connection returns
   🔄 Syncing pending actions...
   ✅ Synced 1/1 actions
   ```

---

## 🛠️ For Developers

### Using the New Hooks

#### Replace old API calls with offline-first hooks:

**Before:**
```jsx
const [zones, setZones] = useState([]);

useEffect(() => {
  const loadZones = async () => {
    const response = await farmAPI.getZones();
    setZones(response.data.zones);
  };
  loadZones();
}, []);
```

**After:**
```jsx
import { useZones } from '../hooks/useZones';

const { zones, loading, error, source } = useZones();
// zones automatically loads from API or cache!
```

#### Save actions with offline support:

```jsx
import { useSaveAction } from '../hooks/useSaveAction';

const { saveAction, saving, isOffline } = useSaveAction();

const handleApprove = async () => {
  const result = await saveAction({
    zone_id: 'CS1',
    irrigation_liters: 25.5,
    fertilizer_N_g: 15.2,
    // ...
  });
  
  if (result.success) {
    alert('✅ Action saved!');
  }
};
```

---

## 📊 What Gets Cached?

| Data Type | Cache Duration | Storage Size |
|-----------|---------------|--------------|
| Zones | Forever (until new data) | ~1 KB |
| Latest sensor data | 7 days | ~50 KB |
| Historical data | 7 days | ~500 KB - 2 MB |
| Pending actions | Until synced | ~10 KB |

**Total:** ~2-3 MB (very efficient!)

---

## 🔍 Debugging

### View Cached Data

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** → **FarmAiDB**
4. Inspect tables:
   - `zones` - List of farm zones
   - `latestData` - Current sensor readings
   - `historyData` - Historical data
   - `pendingActions` - Actions waiting to sync

### Console Logs

Filter console by:
- `📡` - API requests
- `💾` - Cache operations
- `✅` - Success
- `⚠️` - Warnings
- `❌` - Errors

---

## ✅ Checklist - Is It Working?

Test these scenarios:

- [ ] App loads zones when online
- [ ] App loads zones when offline (from cache)
- [ ] Offline badge appears when offline
- [ ] Online badge appears when online
- [ ] Sensor data loads from cache offline
- [ ] Actions save to queue when offline
- [ ] Actions sync when connection returns
- [ ] Console shows sync logs
- [ ] IndexedDB contains cached data
- [ ] Old data gets cleaned up (after 7 days)

---

## 🐛 Troubleshooting

### Problem: "Cannot find module '../hooks/useZones'"

**Solution:** Restart dev server
```bash
npm run dev
```

### Problem: Data not loading offline

**Solution:** Load data while online first (to populate cache)
1. Connect to internet
2. Open app and load zones
3. Select a zone to load sensor data
4. Now go offline → data should load from cache

### Problem: Actions not syncing

**Check:**
1. Is backend running? Visit: `http://localhost:5000/api/health`
2. Check console for sync errors
3. Check IndexedDB → pendingActions table

**Manual sync:**
```javascript
// In browser console:
import { syncPendingActions } from './offline/sync';
await syncPendingActions();
```

---

## 📚 Documentation

For detailed documentation, see:
- [OFFLINE_FIRST_ARCHITECTURE.md](./OFFLINE_FIRST_ARCHITECTURE.md) - Complete architecture guide
- [OFFLINE_IMPLEMENTATION_COMPLETE.md](./OFFLINE_IMPLEMENTATION_COMPLETE.md) - Implementation details

---

## 🎉 Benefits

✅ **Works Offline** - Farmers can access data without internet
✅ **Faster Loading** - Cached data loads instantly
✅ **No Data Loss** - Actions queue and sync automatically
✅ **Automatic Cleanup** - Old data removed after 7 days
✅ **User-Friendly** - Clear offline indicators

---

## 💡 Tips

1. **First Load:** App needs internet on first use to populate cache
2. **Sync Status:** Watch console logs to see sync progress
3. **Storage:** IndexedDB uses ~2-3 MB (very light)
4. **Cleanup:** Runs daily automatically
5. **Mobile:** Works perfectly on mobile devices

---

## 📞 Need Help?

1. Check console logs
2. Inspect IndexedDB in DevTools
3. Read full documentation
4. Test with `npm run dev`

---

**🌾 Your offline-first PWA is ready! Happy farming! 🚜**
