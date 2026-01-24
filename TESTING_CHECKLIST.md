# ✅ Offline-First Testing Checklist

## 🧪 Complete Testing Guide

Use this checklist to verify the offline-first implementation is working correctly.

---

## Pre-Testing Setup

- [ ] Backend server is running (`python backend/app.py`)
- [ ] Frontend dev server is running (`npm run dev`)
- [ ] Browser DevTools is open (F12)
- [ ] Console tab is visible for logs
- [ ] Application tab is open (to check IndexedDB)

---

## Test 1: Online Mode - Fresh Data Loading

### Steps:
1. [ ] Ensure you're online (WiFi connected)
2. [ ] Open app in browser: `http://localhost:3001`
3. [ ] Check console logs for:
   ```
   🚀 Initializing offline-first system...
   ✅ Auto-sync enabled
   📡 Current status: ONLINE
   ```
4. [ ] Look at Navbar - should show blue "🌐 Online" badge
5. [ ] Select a zone from dropdown
6. [ ] Check console for:
   ```
   📡 Fetching zones from API...
   ✅ Loaded 15 zones from API
   📡 Fetching latest data for zone CS1 from API...
   ✅ Loaded latest data for CS1 from API
   ```

### Expected Results:
- [ ] Zones load successfully
- [ ] Sensor data displays
- [ ] Blue online badge visible
- [ ] No errors in console

---

## Test 2: IndexedDB Cache Verification

### Steps:
1. [ ] Open DevTools → Application tab
2. [ ] Expand "IndexedDB" → "FarmAiDB"
3. [ ] Check `zones` table:
   - [ ] Contains zone IDs: CS1, CS2, BS1, etc.
4. [ ] Check `latestData` table:
   - [ ] Contains cached sensor data
   - [ ] Has `cachedAt` timestamp
5. [ ] Check `historyData` table:
   - [ ] Contains historical records
   - [ ] Has zone_id, timestamp, type, data

### Expected Results:
- [ ] All tables populated
- [ ] Data structure correct
- [ ] Timestamps recent

---

## Test 3: Offline Mode - Chrome DevTools

### Steps:
1. [ ] Keep app open
2. [ ] DevTools → Network tab
3. [ ] Select "Offline" from throttling dropdown
4. [ ] Refresh the page
5. [ ] Check console for:
   ```
   ❌ Connection lost - switching to OFFLINE mode
   💾 Loading zones from IndexedDB cache...
   ✅ Loaded 15 zones from cache
   ```
6. [ ] Look at Navbar - should show orange "📴 Offline Mode" badge

### Expected Results:
- [ ] Page loads successfully
- [ ] Zones display from cache
- [ ] Sensor data loads from cache
- [ ] Orange offline badge visible
- [ ] No errors or crashes

---

## Test 4: Offline Mode - WiFi Disconnect

### Steps:
1. [ ] Turn off WiFi/Ethernet
2. [ ] Wait 2-3 seconds
3. [ ] Refresh app
4. [ ] Check console for offline logs
5. [ ] Try selecting different zones
6. [ ] Check if data loads from cache

### Expected Results:
- [ ] App works without internet
- [ ] All cached zones accessible
- [ ] Data displays correctly
- [ ] Orange badge shows
- [ ] No errors

---

## Test 5: API Failure Fallback

### Steps:
1. [ ] Stop the backend server (Ctrl+C)
2. [ ] Keep WiFi on (browser thinks it's online)
3. [ ] Refresh the app
4. [ ] Check console for:
   ```
   📡 Fetching zones from API...
   Error: Network error
   ⚠️ API failed, using 15 cached zones
   ```
5. [ ] Look for warning message in UI

### Expected Results:
- [ ] App doesn't crash
- [ ] Automatic fallback to cache
- [ ] Warning displayed
- [ ] Data still accessible

---

## Test 6: Action Saving Offline

### Steps:
1. [ ] Go offline (DevTools → Offline)
2. [ ] Select a zone (CS1)
3. [ ] Click "Get AI Recommendations"
4. [ ] Click "Approve" (if you have this button)
5. [ ] Check console for:
   ```
   📴 Offline - saving action to IndexedDB...
   ✅ Action saved offline, will sync when connection returns
   ```
6. [ ] Open DevTools → Application → IndexedDB → pendingActions
7. [ ] Verify action is saved with `synced: false`

### Expected Results:
- [ ] Action saved to IndexedDB
- [ ] `synced` field is `false`
- [ ] Timestamp recorded
- [ ] Success message shown

---

## Test 7: Auto-Sync When Connection Returns

### Steps:
1. [ ] Have pending actions (from Test 6)
2. [ ] Go back online (DevTools → Online)
3. [ ] Wait 2-3 seconds
4. [ ] Check console for:
   ```
   ✅ Connection restored - app is now ONLINE
   🔄 Syncing pending actions...
   Syncing 1 pending actions...
   ✅ Synced 1/1 actions
   ```
5. [ ] Check IndexedDB → pendingActions
6. [ ] Verify action now has `synced: true`

### Expected Results:
- [ ] Auto-sync triggers immediately
- [ ] Actions sent to backend
- [ ] `synced` updated to `true`
- [ ] Success logs in console

---

## Test 8: Manual Refresh

### Steps:
1. [ ] Go offline
2. [ ] View cached data
3. [ ] Go back online
4. [ ] Click refresh button (if available in your UI)
5. [ ] Check console for fresh API call

### Expected Results:
- [ ] Fresh data loaded from API
- [ ] Cache updated
- [ ] UI refreshes

---

## Test 9: Multiple Zones Caching

### Steps:
1. [ ] Go online
2. [ ] Select zone CS1 → Wait for data load
3. [ ] Select zone CS2 → Wait for data load
4. [ ] Select zone BS1 → Wait for data load
5. [ ] Go offline
6. [ ] Switch between CS1, CS2, BS1
7. [ ] Verify all cached data loads

### Expected Results:
- [ ] All 3 zones cached
- [ ] Data loads offline
- [ ] No errors
- [ ] Fast switching

---

## Test 10: Analytics Page History

### Steps:
1. [ ] Go online
2. [ ] Navigate to Analytics page
3. [ ] Select a zone
4. [ ] Wait for charts to load
5. [ ] Check console for:
   ```
   📡 Fetching history for zone CS1 from API...
   ✅ Loaded history for CS1 from API
   ```
6. [ ] Go offline
7. [ ] Refresh Analytics page
8. [ ] Check if charts load from cache

### Expected Results:
- [ ] Charts load online
- [ ] History cached
- [ ] Charts load offline from cache
- [ ] No errors

---

## Test 11: Auto-Cleanup (7 Days)

### Steps:
1. [ ] Open console
2. [ ] Run manually:
   ```javascript
   import { runCleanupTasks } from './offline/db';
   await runCleanupTasks();
   ```
3. [ ] Check console for:
   ```
   Running IndexedDB cleanup tasks...
   Cleaned up X old history records
   Cleaned up X old synced actions
   ```

### Expected Results:
- [ ] Cleanup executes
- [ ] Old records deleted
- [ ] Logs show count

---

## Test 12: Network Status Badge

### Steps:
1. [ ] Online: Check sidebar shows blue "🌐 Online"
2. [ ] Offline: Check sidebar shows orange "📴 Offline Mode"
3. [ ] Toggle online/offline multiple times
4. [ ] Verify badge updates in real-time
5. [ ] Check mobile menu has same badge

### Expected Results:
- [ ] Badge displays correctly
- [ ] Color changes (blue/orange)
- [ ] Real-time updates
- [ ] Mobile menu matches

---

## Test 13: Error Handling

### Steps:
1. [ ] Clear IndexedDB (DevTools → Application → IndexedDB → Right-click → Delete)
2. [ ] Go offline
3. [ ] Refresh app
4. [ ] Check error handling

### Expected Results:
- [ ] Graceful error message
- [ ] No app crash
- [ ] Instructions to go online

---

## Test 14: Performance Testing

### Steps:
1. [ ] Online load time:
   - [ ] Open DevTools → Network tab
   - [ ] Refresh page
   - [ ] Note load time: ________ ms
2. [ ] Cached load time:
   - [ ] Go offline
   - [ ] Refresh page
   - [ ] Note load time: ________ ms

### Expected Results:
- [ ] Online: 500-1000ms
- [ ] Cached: 50-100ms
- [ ] 90%+ faster with cache

---

## Test 15: Storage Usage

### Steps:
1. [ ] DevTools → Application → Storage
2. [ ] Check "Usage" section
3. [ ] Note IndexedDB size: ________ MB

### Expected Results:
- [ ] Size: 2-3 MB (efficient!)
- [ ] Not growing indefinitely

---

## Test 16: Mobile Testing

### Steps:
1. [ ] Open mobile emulator (DevTools → Toggle device)
2. [ ] Test mobile menu
3. [ ] Verify offline badge appears
4. [ ] Test all features work mobile

### Expected Results:
- [ ] Mobile UI responsive
- [ ] Offline badge visible
- [ ] All features work

---

## Test 17: Long-Term Offline

### Steps:
1. [ ] Go offline
2. [ ] Use app for 5 minutes
3. [ ] Select zones, view data
4. [ ] Verify no memory leaks
5. [ ] Check console for warnings

### Expected Results:
- [ ] App remains stable
- [ ] No errors accumulate
- [ ] Performance consistent

---

## Test 18: Sync Retry Logic

### Steps:
1. [ ] Save action offline
2. [ ] Go online but keep backend off
3. [ ] Wait 60 seconds (sync timer)
4. [ ] Check console for retry attempts
5. [ ] Start backend
6. [ ] Wait for successful sync

### Expected Results:
- [ ] Retries every 60s
- [ ] Succeeds when backend up
- [ ] No duplicate syncs

---

## Test 19: Concurrent Zones

### Steps:
1. [ ] Open 2 browser tabs
2. [ ] Load different zones in each
3. [ ] Go offline in both
4. [ ] Verify both work independently

### Expected Results:
- [ ] Both tabs work
- [ ] Cache shared correctly
- [ ] No conflicts

---

## Test 20: Full User Journey

### Steps:
1. [ ] Start online
2. [ ] Load dashboard
3. [ ] Select zone CS1
4. [ ] View sensor data
5. [ ] Get AI recommendation
6. [ ] Go offline
7. [ ] Switch to zone CS2
8. [ ] View cached data
9. [ ] Approve recommendation (saves offline)
10. [ ] Go to Analytics
11. [ ] View charts from cache
12. [ ] Go back online
13. [ ] Verify auto-sync

### Expected Results:
- [ ] Smooth transition online→offline
- [ ] All features work
- [ ] Data syncs automatically
- [ ] No errors or crashes

---

## 📊 Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Test 1: Online Mode | ⬜ | |
| Test 2: IndexedDB | ⬜ | |
| Test 3: Offline DevTools | ⬜ | |
| Test 4: Offline WiFi | ⬜ | |
| Test 5: API Fallback | ⬜ | |
| Test 6: Save Offline | ⬜ | |
| Test 7: Auto-Sync | ⬜ | |
| Test 8: Manual Refresh | ⬜ | |
| Test 9: Multiple Zones | ⬜ | |
| Test 10: Analytics | ⬜ | |
| Test 11: Cleanup | ⬜ | |
| Test 12: Badge | ⬜ | |
| Test 13: Error Handling | ⬜ | |
| Test 14: Performance | ⬜ | |
| Test 15: Storage | ⬜ | |
| Test 16: Mobile | ⬜ | |
| Test 17: Long-Term | ⬜ | |
| Test 18: Sync Retry | ⬜ | |
| Test 19: Concurrent | ⬜ | |
| Test 20: Full Journey | ⬜ | |

**Total Tests Passed:** _____ / 20

---

## 🐛 Bug Tracking

| Bug # | Description | Severity | Status |
|-------|-------------|----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## ✅ Sign-Off

- **Tester Name:** ______________________
- **Date:** ______________________
- **Environment:** ______________________
- **Browser:** ______________________
- **Overall Status:** ⬜ PASS / ⬜ FAIL

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**✨ Once all tests pass, your offline-first PWA is production-ready! 🚀**
