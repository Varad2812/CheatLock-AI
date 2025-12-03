# Verify Audio Recording Setup

## Quick Verification (2 minutes)

### Step 1: Check Database Schema

Open Supabase SQL Editor and run:

```sql
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'violations'
ORDER BY column_name;
```

**Look for these columns:**
- ✅ `audio_duration` (integer)
- ✅ `audio_level` (double precision)  
- ✅ `audio_recording` (text)
- ✅ `snapshot_url` (text)

**If missing**, run this:

```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

### Step 2: Check Existing Violations

```sql
SELECT 
  COUNT(*) as total_violations,
  COUNT(snapshot_url) as with_snapshots,
  COUNT(audio_recording) as with_audio
FROM violations;
```

**Expected Result:**
- If you've tested before: Some violations should have snapshots
- If columns were missing: All counts will be 0

### Step 3: Test New Violation

1. **Start exam as student**
2. **Speak loudly**: "Testing one two three"
3. **Open browser console** (F12)
4. **Look for**:
   ```
   ✅ Audio violation detected - starting audio recording
   ✅ Audio recording completed: duration: 3000ms
   ✅ Violation saved to database
   ```

5. **Check database**:
   ```sql
   SELECT 
     violation_type,
     snapshot_url IS NOT NULL as has_snapshot,
     audio_recording IS NOT NULL as has_audio,
     audio_duration,
     audio_level,
     detected_at
   FROM violations
   ORDER BY detected_at DESC
   LIMIT 1;
   ```

**Expected Result:**
- `violation_type`: audio_speech or audio_external
- `has_snapshot`: true
- `has_audio`: true
- `audio_duration`: 3000
- `audio_level`: 0.15 to 1.0

### Step 4: Check Reports Page

1. **Login as teacher**
2. **Go to exam reports**
3. **Find the test attempt**
4. **Look for "Evidence" button**
5. **Click it**
6. **Verify**:
   - Modal opens
   - Violation card shows
   - Snapshot image displays
   - Audio player appears
   - Can play audio

## Troubleshooting

### ❌ No "Evidence" Button

**Cause**: No violations with snapshots or audio
**Fix**: 
```sql
-- Check if any violations exist
SELECT COUNT(*) FROM violations;

-- Check if they have evidence
SELECT 
  COUNT(*) as total,
  COUNT(snapshot_url) as with_snapshots,
  COUNT(audio_recording) as with_audio
FROM violations;
```

### ❌ Database Error in Console

**Error**: `column "audio_recording" does not exist`
**Fix**: Run the ALTER TABLE command above

### ❌ Audio Not Recording

**Check**:
1. Microphone permission granted?
2. Console shows "AudioRecorder initialized"?
3. Audio sensitivity > 0?

```sql
SELECT audio_sensitivity FROM system_settings;
```

### ❌ Snapshots Not Showing

**Check**:
1. `requiresSnapshot: true` in violation detectors?
2. Camera permission granted?
3. Video element working?

## Complete Test Flow

### 1. Apply Migration
```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

### 2. Restart Dev Server
```bash
cd client
npm run dev
```

### 3. Clear Browser Cache
- Press Ctrl+Shift+Delete
- Clear cache
- Reload page

### 4. Start Fresh Exam
- Login as student
- Start exam
- Grant camera + mic permissions

### 5. Trigger Violations
- **Gaze**: Look away from screen for 3 seconds
- **Audio**: Speak loudly for 3 seconds
- **Tab**: Switch to another tab

### 6. Check Console
```
✅ Proctoring engine started successfully
✅ AudioRecorder initialized successfully
⚠️ Violation detected
📸 Capturing snapshot
🎙️ Audio recording completed
💾 Violation saved to database
```

### 7. Verify Database
```sql
SELECT 
  violation_type,
  severity,
  description,
  LENGTH(snapshot_url) as snapshot_size,
  LENGTH(audio_recording) as audio_size,
  audio_duration,
  audio_level,
  detected_at
FROM violations
ORDER BY detected_at DESC
LIMIT 5;
```

### 8. Check Reports
- Login as teacher
- View exam reports
- Click "Evidence"
- Verify all evidence shows

## Success Criteria

✅ Database columns exist
✅ Violations being created
✅ Snapshots being captured (snapshot_url not null)
✅ Audio being recorded (audio_recording not null)
✅ "Evidence" button appears
✅ Modal opens with violations
✅ Snapshots display correctly
✅ Audio player works
✅ Can hear recorded audio

## If Everything Fails

### Nuclear Option: Fresh Start

1. **Drop and recreate violations table**:
```sql
-- BACKUP FIRST!
CREATE TABLE violations_backup AS SELECT * FROM violations;

-- Drop and recreate
DROP TABLE violations CASCADE;

-- Run full schema.sql again
-- Then run audio migration
```

2. **Clear all browser data**
3. **Restart everything**
4. **Test from scratch**

## Quick Fix Script

Run this in Supabase SQL Editor:

```sql
-- 1. Add columns if missing
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;

-- 2. Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'violations'
AND column_name IN ('audio_recording', 'audio_duration', 'audio_level', 'snapshot_url');

-- 3. Check existing data
SELECT 
  COUNT(*) as total_violations,
  COUNT(snapshot_url) as with_snapshots,
  COUNT(audio_recording) as with_audio,
  COUNT(CASE WHEN snapshot_url IS NOT NULL OR audio_recording IS NOT NULL THEN 1 END) as with_evidence
FROM violations;

-- 4. Show recent violations
SELECT 
  violation_type,
  snapshot_url IS NOT NULL as has_snapshot,
  audio_recording IS NOT NULL as has_audio,
  detected_at
FROM violations
ORDER BY detected_at DESC
LIMIT 10;
```

## Expected Output

```
column_name      | data_type
-----------------+------------------
audio_duration   | integer
audio_level      | double precision
audio_recording  | text
snapshot_url     | text

total_violations | with_snapshots | with_audio | with_evidence
-----------------+----------------+------------+--------------
5                | 3              | 2          | 5
```

## Still Not Working?

1. Share the output of the verification queries
2. Share browser console errors
3. Share Supabase logs
4. Check DEBUG_AUDIO_ISSUE.md for more details

## Most Common Issue

**99% of the time it's**: Database migration not applied!

**Solution**: Run the ALTER TABLE command and restart!
