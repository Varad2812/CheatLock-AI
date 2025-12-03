# 🔧 COMPLETE FIX FOR EVIDENCE ISSUE

## DO THESE STEPS IN ORDER

### Step 1: Apply Database Migration (CRITICAL!)

Open Supabase SQL Editor and run:

```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

**Why**: Without these columns, audio recordings can't be saved!

### Step 2: Verify Columns Exist

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'violations'
AND column_name LIKE '%audio%';
```

**Expected Output**:
```
audio_duration
audio_level
audio_recording
```

**If empty**: Migration didn't work. Try again.

### Step 3: Restart Development Server

```bash
# Stop server (Ctrl+C)
cd client
npm run dev
```

**Why**: Load the updated code with snapshot and audio fixes.

### Step 4: Clear ALL Browser Data

1. Press `Ctrl + Shift + Delete`
2. Select "All time"
3. Check:
   - Cookies
   - Cached images and files
   - Cached data
4. Click "Clear data"
5. Close ALL browser tabs
6. Reopen browser

**Why**: Old cached code might not have the fixes.

### Step 5: Start BRAND NEW Exam

**IMPORTANT**: Don't use old exams! Start a completely new one.

1. Login as student
2. Go to dashboard
3. Start exam
4. Grant camera permission
5. Grant microphone permission
6. Open console (F12)

### Step 6: Check Console for Initialization

You should see:
```
✅ Proctoring engine started successfully
✅ AudioRecorder initialized successfully
✅ Proctoring activated! (3 violations allowed)
```

**If you don't see these**: Proctoring didn't start. Check permissions.

### Step 7: Trigger Gaze Violation

1. Look LEFT for 3 seconds
2. Check console immediately

**Expected Console Output**:
```
⚠️ Violation detected
📸 Capturing snapshot for violation: gaze_sideward
✅ Snapshot captured, size: 45 KB
💾 Saving violation to database
✅ Violation saved to database
```

**If you see this**: Snapshots are working! ✅

**If you don't see "Capturing snapshot"**: 
- Check if video element is visible
- Check camera permission
- Refresh page and try again

### Step 8: Trigger Audio Violation

1. Speak LOUDLY for 3 seconds: "Testing audio recording"
2. Check console immediately

**Expected Console Output**:
```
⚠️ Audio violation detected - starting audio recording
🎙️ Started audio recording for 3000ms
✅ Audio recording completed: duration: 3000ms, size: 42.5 KB
📸 Capturing snapshot for violation: audio_speech
✅ Snapshot captured, size: 45 KB
💾 Saving violation to database
✅ Violation saved to database
```

**If you see this**: Audio recording is working! ✅

**If you don't see "Audio recording completed"**:
- Check microphone permission
- Check if migration was applied
- Check console for errors

### Step 9: Verify in Database

Run in Supabase SQL Editor:

```sql
SELECT 
  violation_type,
  LENGTH(snapshot_url) as snapshot_size,
  LENGTH(audio_recording) as audio_size,
  audio_duration,
  audio_level,
  detected_at
FROM violations
ORDER BY detected_at DESC
LIMIT 5;
```

**Expected for Gaze Violation**:
- `snapshot_size`: 40000-80000 (not NULL)
- `audio_size`: NULL (no audio for gaze)

**Expected for Audio Violation**:
- `snapshot_size`: 40000-80000 (not NULL)
- `audio_size`: 40000-60000 (not NULL)
- `audio_duration`: 3000
- `audio_level`: 0.15-1.0

**If all NULL**: Evidence isn't being saved. Check console for errors.

### Step 10: Check Teacher Reports

1. Login as teacher
2. Go to exam reports
3. Find the test attempt
4. **Evidence button should show** with count: `[Evidence (2)]`
5. Click it
6. Modal should open showing:
   - Violation #1: Gaze Sideward
     - Snapshot image ✅
   - Violation #2: Audio Speech
     - Snapshot image ✅
     - Audio player ✅

**If Evidence button doesn't show**:
- Check if violations exist in database
- Refresh page
- Clear cache again

**If modal is empty**:
- Check database query results
- Verify violations have snapshot_url or audio_recording

**If snapshots don't display**:
- Check if snapshot_url has data
- Check browser console for image loading errors

**If audio doesn't play**:
- Check if audio_recording has data
- Try different browser
- Check audio format support

## Troubleshooting Specific Issues

### Issue: "Capturing snapshot" not in console

**Cause**: requiresSnapshot might be false or video element not working

**Fix**:
1. Check if you can see yourself in the video preview
2. If not, camera permission is denied
3. Grant permission and refresh

### Issue: "Audio recording completed" not in console

**Cause**: AudioRecorder not initialized or migration not applied

**Fix**:
1. Check console for "AudioRecorder initialized"
2. If not there, check microphone permission
3. Verify migration was applied
4. Restart server

### Issue: Database shows NULL for snapshot_url

**Cause**: Snapshot capture failed

**Fix**:
1. Check console for errors during capture
2. Verify video element is working
3. Check canvas element exists
4. Try different browser

### Issue: Database shows NULL for audio_recording

**Cause**: Column doesn't exist or recording failed

**Fix**:
1. Verify migration was applied
2. Check console for recording errors
3. Verify microphone permission
4. Check audio sensitivity > 0

### Issue: Evidence button shows but modal empty

**Cause**: Violations exist but have no evidence

**Fix**: This is expected for OLD violations. Create NEW violations after applying fixes.

## Complete Test Checklist

- [ ] Database migration applied
- [ ] Columns verified to exist
- [ ] Server restarted
- [ ] Browser cache cleared
- [ ] New exam started (not old one)
- [ ] Camera permission granted
- [ ] Microphone permission granted
- [ ] Console shows "Proctoring engine started"
- [ ] Console shows "AudioRecorder initialized"
- [ ] Gaze violation triggered
- [ ] Console shows "Capturing snapshot"
- [ ] Console shows "Snapshot captured"
- [ ] Audio violation triggered
- [ ] Console shows "Audio recording completed"
- [ ] Database shows snapshot_url not NULL
- [ ] Database shows audio_recording not NULL
- [ ] Evidence button appears in reports
- [ ] Modal opens with violations
- [ ] Snapshots display correctly
- [ ] Audio player appears
- [ ] Audio plays successfully

## If STILL Not Working

### Nuclear Option: Complete Reset

1. **Delete all violations**:
```sql
DELETE FROM violations;
```

2. **Delete all attempts**:
```sql
DELETE FROM exam_attempts;
```

3. **Verify migration**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'violations';
```

4. **Restart everything**:
```bash
# Kill server
cd client
rm -rf .next
npm run dev
```

5. **Clear browser completely**:
- Close all tabs
- Clear all data
- Restart browser

6. **Start fresh exam**:
- New login
- New exam
- New violations

7. **Check console for EVERY step**

## Success Indicators

✅ Console: "Capturing snapshot for violation"
✅ Console: "Snapshot captured, size: XX KB"
✅ Console: "Audio recording completed"
✅ Database: snapshot_url IS NOT NULL
✅ Database: audio_recording IS NOT NULL
✅ Reports: Evidence button shows
✅ Modal: Snapshots display
✅ Modal: Audio player works

## What to Share If Still Broken

1. **Console output** (full log from exam start)
2. **Database query results** (violations table)
3. **Schema check** (column names)
4. **Screenshot of reports page**
5. **Screenshot of evidence modal**
6. **Browser and version**
7. **Any error messages**

---

**The most common issue is the database migration not being applied. Make sure you run it!**
