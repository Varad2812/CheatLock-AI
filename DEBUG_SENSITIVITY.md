# Debug Sensitivity Settings

## Step 1: Check Database

Run this in Supabase SQL Editor:

```sql
SELECT 
  id,
  violation_threshold,
  gaze_sensitivity,
  audio_sensitivity,
  face_missing_timeout
FROM system_settings;
```

**Expected when set to 0:**
```
gaze_sensitivity: 0
audio_sensitivity: 0
```

**If NOT 0**: The admin page isn't saving correctly.

## Step 2: Check Console During Exam

When you start an exam, check browser console (F12) for:

```
System settings loaded: { ... }
Violation threshold: 3
Audio sensitivity: 0  ← Should be 0 if disabled
Gaze sensitivity: 0   ← Should be 0 if disabled
```

**If showing 0**: Settings are loaded correctly ✅
**If NOT showing 0**: Database not updated or exam using cached values

## Step 3: Check Detector Initialization

Console should show:

```
GazeViolationDetector initialized: { gazeSensitivity: 0, ... }
AudioViolationDetector initialized: { audioSensitivity: 0, ... }
```

**If showing 0**: Detectors initialized with correct values ✅

## Step 4: Trigger Violation

Look away or speak.

**Expected with sensitivity = 0:**
- NO violation messages
- NO "Capturing snapshot"
- NO "Audio recording"

**If violations still trigger:**
- Check if you restarted the exam AFTER changing settings
- Old exams use old settings!

## Common Issues

### Issue 1: Settings Not Saving

**Symptom**: Database still shows old values

**Fix**: Check admin dashboard console for errors

**Test**: 
```sql
-- Manually update
UPDATE system_settings
SET gaze_sensitivity = 0, audio_sensitivity = 0
WHERE id = (SELECT id FROM system_settings LIMIT 1);

-- Verify
SELECT * FROM system_settings;
```

### Issue 2: Exam Using Old Settings

**Symptom**: Console shows old values when exam starts

**Cause**: Exam was started BEFORE you changed settings

**Fix**: 
1. Change settings in admin
2. Start a NEW exam (not continue old one)
3. Check console for new values

### Issue 3: Browser Cache

**Symptom**: Code changes not reflected

**Fix**:
1. Hard reload: `Ctrl + Shift + R`
2. Clear cache
3. Restart dev server

## Quick Test Script

### 1. Set to 0 in Admin
```
Admin Dashboard → System Settings
Gaze Sensitivity: 0
Audio Sensitivity: 0
Click Save
```

### 2. Verify in Database
```sql
SELECT gaze_sensitivity, audio_sensitivity FROM system_settings;
-- Should return: 0, 0
```

### 3. Start NEW Exam
```
Login as student
Start exam (NEW, not old one)
Check console:
  "Gaze sensitivity: 0"
  "Audio sensitivity: 0"
```

### 4. Test Detection
```
Look away for 5 seconds
Speak loudly for 5 seconds
```

**Expected**: NO violations

### 5. Enable Detection
```
Admin → Set to 0.2 and 0.15
Start NEW exam
Look away / speak
```

**Expected**: Violations detected

## Debug Checklist

- [ ] Database shows sensitivity = 0
- [ ] Admin page shows sliders at 0
- [ ] Started NEW exam after changing settings
- [ ] Console shows "Gaze sensitivity: 0"
- [ ] Console shows "Audio sensitivity: 0"
- [ ] Detector initialized with 0
- [ ] No violations when looking away
- [ ] No violations when speaking
- [ ] Hard reloaded browser
- [ ] Restarted dev server

## If Still Not Working

### Check if detectors are checking sensitivity:

In `client/proctoring/gazeDetector.ts`:
```typescript
// Should be at the START of checkViolation()
if (this.GAZE_SENSITIVITY === 0) {
  return { isViolation: false };
}
```

In `client/proctoring/audioDetector.ts`:
```typescript
// Should be at the START of checkViolation()
if (this.HIGH_NOISE_THRESHOLD === 0) {
  return { isViolation: false };
}
```

### Force Update Database

```sql
-- Reset to defaults
UPDATE system_settings
SET 
  gaze_sensitivity = 0.2,
  audio_sensitivity = 0.15,
  violation_threshold = 3,
  face_missing_timeout = 5;

-- Test with 0
UPDATE system_settings
SET 
  gaze_sensitivity = 0,
  audio_sensitivity = 0;

-- Verify
SELECT * FROM system_settings;
```

## What to Share

If still not working, share:

1. **Database query result**:
```sql
SELECT * FROM system_settings;
```

2. **Console output** when starting exam (copy all)

3. **Console output** when violation occurs

4. **Screenshot** of admin settings page

5. **Did you start a NEW exam?** (Yes/No)

---

**Most common issue**: Using an old exam that was started before changing settings. Always start a NEW exam after changing settings!
