# DEBUG EVIDENCE ISSUE - DO THIS NOW

## Step 1: Check Browser Console

Open browser console (F12) during exam and look for these messages:

### Expected Messages (Working)
```
✅ Capturing snapshot for violation: gaze_sideward
✅ Snapshot captured, size: 45 KB
✅ Audio violation detected - starting audio recording
✅ Audio recording completed: duration: 3000ms, size: 42 KB
✅ Violation saved to database
```

### Error Messages (Not Working)
```
❌ Failed to capture snapshot
❌ Failed to start recording
❌ Database error saving violation
❌ Column "audio_recording" does not exist
```

## Step 2: Check Database Directly

Run this in Supabase SQL Editor:

```sql
-- Check if violations exist
SELECT 
  id,
  violation_type,
  snapshot_url,
  audio_recording,
  detected_at
FROM violations
ORDER BY detected_at DESC
LIMIT 5;
```

### What to Look For

**If snapshot_url is NULL**:
- Snapshots aren't being captured
- Check console for "Capturing snapshot" message

**If audio_recording is NULL**:
- Audio isn't being recorded
- Check if column exists (run migration)

**If both are NULL**:
- Evidence isn't being saved at all
- Check console for errors

## Step 3: Verify Database Schema

```sql
-- Check if audio columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'violations'
AND column_name IN ('snapshot_url', 'audio_recording', 'audio_duration', 'audio_level');
```

### Expected Result
```
column_name      | data_type
-----------------+------------------
snapshot_url     | text
audio_recording  | text
audio_duration   | integer
audio_level      | double precision
```

**If audio columns are missing**, run this:

```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

## Step 4: Check Violation Details

```sql
-- Get detailed violation info
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

### What the Numbers Mean

**snapshot_size**:
- NULL or 0 = No snapshot
- 40000-80000 = Good snapshot (40-80 KB)

**audio_size**:
- NULL or 0 = No audio
- 40000-60000 = Good audio (40-60 KB)

## Step 5: Test Snapshot Capture Manually

Open browser console and run:

```javascript
// Test if video element exists
console.log('Video:', document.querySelector('video'));

// Test if canvas exists
console.log('Canvas:', document.querySelector('canvas'));

// Test snapshot capture
const video = document.querySelector('video');
const canvas = document.querySelector('canvas');
if (video && canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  const snapshot = canvas.toDataURL('image/jpeg', 0.6);
  console.log('Snapshot size:', snapshot.length, 'bytes');
  console.log('Snapshot preview:', snapshot.substring(0, 100));
}
```

**Expected**: Should show snapshot size > 40000 bytes

## Step 6: Check Permissions

```javascript
// Check camera permission
navigator.mediaDevices.getUserMedia({ video: true })
  .then(() => console.log('✅ Camera OK'))
  .catch(err => console.error('❌ Camera error:', err));

// Check microphone permission
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Microphone OK'))
  .catch(err => console.error('❌ Microphone error:', err));
```

## Common Issues & Fixes

### Issue 1: "Column audio_recording does not exist"

**Fix**: Run migration
```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

### Issue 2: Snapshots are NULL

**Possible Causes**:
1. Video element not working
2. Canvas element missing
3. Camera permission denied
4. requiresSnapshot is false

**Fix**: Check console for "Capturing snapshot" message

### Issue 3: Audio is NULL

**Possible Causes**:
1. Migration not applied
2. Microphone permission denied
3. AudioRecorder not initialized
4. Audio sensitivity is 0

**Fix**: 
- Apply migration
- Check microphone permission
- Check console for "AudioRecorder initialized"

### Issue 4: Evidence Button Shows But Modal Empty

**Cause**: Violations exist but have no snapshots/audio

**Fix**: This is expected for old violations. New violations should have evidence.

## Quick Test Script

Copy and paste this in browser console during exam:

```javascript
// Check proctoring status
console.log('=== PROCTORING STATUS ===');
console.log('Video element:', !!document.querySelector('video'));
console.log('Canvas element:', !!document.querySelector('canvas'));
console.log('Video playing:', document.querySelector('video')?.readyState === 4);

// Trigger test violation
console.log('=== TRIGGERING TEST ===');
console.log('Look away from screen for 3 seconds...');

// After violation, check database
setTimeout(() => {
  console.log('=== CHECK DATABASE NOW ===');
  console.log('Run this in Supabase SQL Editor:');
  console.log('SELECT * FROM violations ORDER BY detected_at DESC LIMIT 1;');
}, 5000);
```

## What to Share for Debugging

If still not working, share:

1. **Console output** (copy all messages)
2. **Database query result** (violations table)
3. **Schema check result** (column names)
4. **Browser** (Chrome/Firefox/Safari)
5. **Any error messages**

## Most Likely Issues

### 90% Chance: Database Migration Not Applied

**Symptom**: Audio columns don't exist
**Fix**: Run the ALTER TABLE command above

### 5% Chance: Camera/Mic Permission Denied

**Symptom**: Video element not working
**Fix**: Grant permissions in browser

### 5% Chance: Code Not Updated

**Symptom**: Console doesn't show "Capturing snapshot"
**Fix**: Restart dev server, clear cache

## Emergency Fix: Force Evidence Capture

If nothing works, try this temporary fix:

```sql
-- Manually insert test violation with evidence
INSERT INTO violations (
  attempt_id,
  violation_type,
  severity,
  description,
  snapshot_url,
  audio_recording,
  audio_duration,
  audio_level,
  detected_at
) VALUES (
  (SELECT id FROM exam_attempts ORDER BY started_at DESC LIMIT 1),
  'gaze_sideward',
  0.7,
  'Test violation with evidence',
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
  'U0dWbGJHOGdWMjl5Yk