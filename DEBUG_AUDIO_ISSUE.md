# Debug Audio Recording Issue

## Problem
- Evidence section not showing
- Gaze detection snapshots not visible
- Audio violations not being recorded

## Quick Fixes

### 1. Apply Database Migration (MOST LIKELY ISSUE)

The audio recording columns don't exist yet in your database!

```bash
# Open Supabase SQL Editor and run:
```

```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

### 2. Check Browser Console

Open browser console (F12) during exam and look for:

**Expected (Working)**:
```
✅ Proctoring engine started successfully
✅ AudioRecorder initialized successfully
⚠️ Audio violation detected - starting audio recording
✅ Audio recording completed
✅ Violation saved to database
```

**Error (Not Working)**:
```
❌ Database error saving violation: column "audio_recording" does not exist
```

### 3. Verify Database Schema

Run this in Supabase SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'violations';
```

**Should include**:
- `audio_recording` (text)
- `audio_duration` (integer)
- `audio_level` (double precision)

### 4. Check Existing Violations

```sql
SELECT 
  id,
  violation_type,
  snapshot_url IS NOT NULL as has_snapshot,
  audio_recording IS NOT NULL as has_audio,
  detected_at
FROM violations
ORDER BY detected_at DESC
LIMIT 10;
```

### 5. Test Audio Recording

1. Start a new exam as student
2. Open browser console (F12)
3. Speak loudly: "Testing audio"
4. Check console for messages
5. Check database for new violation

```sql
SELECT * FROM violations 
WHERE audio_recording IS NOT NULL
ORDER BY detected_at DESC
LIMIT 1;
```

### 6. Check Evidence Button Logic

The "Evidence" button only shows if there are snapshots OR audio recordings:

```typescript
{attempt.violations.some(v => v.snapshot_url || (v as any).audio_recording) && (
  <button>Evidence</button>
)}
```

**If no violations have snapshots or audio, button won't appear!**

### 7. Force Snapshot Capture

Check if `requiresSnapshot` is true for violations:

```typescript
// In gazeDetector.ts
return {
  isViolation: true,
  type: 'gaze_away',
  severity: 0.7,
  description: 'Looking away',
  requiresSnapshot: true, // ← Must be true!
};
```

### 8. Check Audio Sensitivity

If audio sensitivity is 0, audio detection is disabled:

```sql
SELECT audio_sensitivity FROM system_settings;
```

Should be > 0 (default: 0.6 or 0.15)

## Common Issues

### Issue 1: Database Migration Not Applied
**Symptom**: Error in console about missing columns
**Fix**: Run the SQL migration above

### Issue 2: No Violations Captured
**Symptom**: Violations table is empty
**Fix**: 
- Check if proctoring is actually running
- Look for console errors
- Verify camera/mic permissions

### Issue 3: Snapshots Not Captured
**Symptom**: `snapshot_url` is NULL
**Fix**:
- Check if `requiresSnapshot: true` in violation detector
- Verify video element is working
- Check canvas element exists

### Issue 4: Audio Not Recording
**Symptom**: `audio_recording` is NULL even for audio violations
**Fix**:
- Check microphone permission
- Verify AudioRecorder initialized
- Check browser supports MediaRecorder

### Issue 5: Evidence Button Not Showing
**Symptom**: No "Evidence" button in reports
**Fix**:
- Check if violations have `snapshot_url` OR `audio_recording`
- Run query to verify data exists
- Check filter logic in reports page

## Quick Test Script

```javascript
// Run in browser console during exam

// 1. Check if proctoring is active
console.log('Proctoring active:', window.proctoringEngine?.isActive);

// 2. Trigger audio violation manually
// Just speak loudly for 3-5 seconds

// 3. Check violation count
console.log('Violations:', window.proctoringEngine?.getViolationCount());

// 4. Check database
// Go to Supabase and run:
// SELECT * FROM violations ORDER BY detected_at DESC LIMIT 5;
```

## Step-by-Step Debug

### Step 1: Verify Database
```sql
-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'violations' 
AND column_name LIKE '%audio%';

-- Should return:
-- audio_recording
-- audio_duration  
-- audio_level
```

### Step 2: Create Test Violation
```sql
-- Insert test violation with snapshot
INSERT INTO violations (
  attempt_id,
  violation_type,
  severity,
  description,
  snapshot_url,
  detected_at
) VALUES (
  (SELECT id FROM exam_attempts LIMIT 1),
  'gaze_away',
  0.7,
  'Test violation',
  'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  NOW()
);
```

### Step 3: Check Reports Page
1. Go to teacher reports
2. Find the attempt
3. Look for "Evidence" button
4. Click and verify modal opens

### Step 4: Test Audio Recording
1. Start new exam
2. Speak during exam
3. Check console for "Audio recording completed"
4. Check database for audio_recording data

## Solution Checklist

- [ ] Database migration applied
- [ ] Columns exist in violations table
- [ ] Browser console shows no errors
- [ ] Microphone permission granted
- [ ] Camera permission granted
- [ ] Proctoring engine initialized
- [ ] AudioRecorder initialized
- [ ] Violations being created
- [ ] Snapshots being captured
- [ ] Audio being recorded
- [ ] Evidence button showing
- [ ] Modal opening correctly
- [ ] Audio player working

## If Still Not Working

1. **Clear browser cache** and reload
2. **Restart development server**
3. **Check Supabase logs** for errors
4. **Verify RLS policies** aren't blocking
5. **Test in incognito mode**
6. **Try different browser**

## Contact Points

Check these files if issues persist:
- `client/proctoring/proctoringEngine.ts` - Main proctoring logic
- `client/proctoring/audioRecorder.ts` - Audio recording
- `client/app/teacher/exam/[id]/reports/page.tsx` - Reports UI
- `supabase/add_audio_recordings.sql` - Database migration

## Most Likely Solution

**90% chance the issue is**: Database migration not applied!

Run this NOW:
```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

Then restart your exam and test again!
