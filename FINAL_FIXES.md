# Final Fixes - System Settings & Audio Detection

## Issues Fixed

### 1. System Settings Not Working ✅

**Problem**: Violation threshold hardcoded to 3, ignoring database settings.

**Solution**:
- Load system settings from database on exam start
- Use `violation_threshold` from settings table
- Default to 3 if settings not found
- Display actual threshold in UI
- Update toast messages with correct threshold

**Code Changes**:
```typescript
// Load system settings from database
const { data: settings } = await supabase
  .from('system_settings')
  .select('*')
  .single();

const violationThreshold = settings?.violation_threshold || 3;

// Use in proctoring engine
const engine = new ProctoringEngine({
  attemptId: attemptData.id,
  violationThreshold,  // From database
  onViolation: handleViolation,
  onExamEnd: handleExamEnd,
});
```

**UI Updates**:
- Violation counter shows: `Violations: X/Y` (Y from database)
- Toast shows: `Violation X/Y: description`
- Auto-end message: `Y violations detected`

### 2. Microphone Not Detecting ✅

**Problem**: Audio detection thresholds too high, not sensitive enough.

**Root Causes**:
- Speech detection threshold: 50 peaks → Too high
- Noise level threshold: 0.3 (30%) → Too high
- Peak difference threshold: 10 → Too high
- Required detections: 5 → Too high
- Duration: 3 seconds → Too long

**Solution - Increased Sensitivity**:

#### Speech Detection
```typescript
// Before
if (diff > 10) peakCount++;  // Too high
return peakCount > 50;       // Too high

// After
if (diff > 5) peakCount++;   // More sensitive
return peakCount > 30;       // More sensitive
```

#### Noise Level Threshold
```typescript
// Before
private readonly HIGH_NOISE_THRESHOLD = 0.3;  // 30%

// After
private readonly HIGH_NOISE_THRESHOLD = 0.15; // 15%
```

#### Detection Duration
```typescript
// Before
private readonly SPEECH_DURATION_THRESHOLD = 3000; // 3 seconds

// After
private readonly SPEECH_DURATION_THRESHOLD = 2000; // 2 seconds
```

#### Required Detections
```typescript
// Before
if (recentSpeech.length > 5) { ... }
if (highNoiseCount > 8) { ... }

// After
if (recentSpeech.length > 3) { ... }  // More sensitive
if (highNoiseCount > 5) { ... }       // More sensitive
```

### 3. Audio Monitoring Logs ✅

**Added Debug Logging**:
```typescript
// Log audio levels every 2 seconds
if (Date.now() % 2000 < 100) {
  console.log('Audio monitoring:', {
    noiseLevel: (noiseLevel * 100).toFixed(1) + '%',
    speechDetected,
    threshold: '15%'
  });
}
```

**What to Look For**:
- Check browser console during exam
- Should see: `Audio monitoring: { noiseLevel: 'X%', speechDetected: true/false, threshold: '15%' }`
- If noiseLevel stays at 0%, microphone not working
- If noiseLevel > 15%, should trigger violation

### 4. Auto-Submit After Threshold ✅

**Problem**: Exam not ending after reaching violation threshold.

**Solution**:
- Use dynamic threshold from proctoring engine
- Check threshold correctly in violation handler
- Proper logging to track threshold checks

**Code**:
```typescript
function handleViolation(violation: ViolationEvent) {
  setViolations((prev) => {
    const newViolations = [...prev, violation];
    const violationCount = newViolations.length;
    const threshold = proctoringEngineRef.current?.getViolationThreshold() || 3;
    
    console.log(`Total violations: ${violationCount}/${threshold}`);
    
    if (violationCount >= threshold) {
      console.log('Violation threshold reached - ending exam');
      setTimeout(() => handleExamEnd(`${threshold} violations detected`), 500);
    }
    
    return newViolations;
  });
}
```

## Testing Instructions

### Test 1: System Settings Integration

1. **Update Database Settings**:
```sql
UPDATE system_settings 
SET violation_threshold = 5,
    audio_sensitivity = 0.2,
    gaze_sensitivity = 0.2,
    face_missing_timeout = 5;
```

2. **Start Exam**:
   - Check browser console for: `System settings loaded: {...}`
   - Check console for: `Violation threshold: 5`
   - Verify toast shows: `Proctoring activated! (5 violations allowed)`

3. **Trigger Violations**:
   - Tab switch 5 times
   - Verify counter shows: `Violations: 1/5`, `2/5`, etc.
   - Verify exam ends after 5th violation
   - Verify toast: `5 violations detected`

### Test 2: Microphone Detection

1. **Start Exam**:
   - Open browser console
   - Look for: `Audio monitoring: { noiseLevel: 'X%', speechDetected: false, threshold: '15%' }`

2. **Test Silence**:
   - Stay quiet
   - Verify noiseLevel stays low (< 5%)
   - Verify no violations triggered

3. **Test Speaking**:
   - Speak normally for 2-3 seconds
   - Watch console: noiseLevel should increase (> 15%)
   - Verify `speechDetected: true` appears
   - Verify violation triggered after 2 seconds
   - Verify toast: `Violation X/Y: Speech or talking detected`

4. **Test Loud Noise**:
   - Clap hands or make loud noise
   - Verify noiseLevel spikes
   - Verify violation triggered
   - Verify toast: `Excessive noise detected`

5. **Check Snapshot**:
   - After audio violation, check database:
   ```sql
   SELECT violation_type, description, metadata, snapshot_url 
   FROM violations 
   WHERE violation_type IN ('audio_speech', 'audio_external')
   ORDER BY detected_at DESC 
   LIMIT 1;
   ```
   - Verify `metadata` contains: `{ "audioLevel": 0.XX }`
   - Verify `snapshot_url` contains base64 image

### Test 3: Auto-Submit

1. **Set Low Threshold**:
```sql
UPDATE system_settings SET violation_threshold = 2;
```

2. **Start Exam**:
   - Verify UI shows: `Violations: 0/2`

3. **Trigger 2 Violations**:
   - Tab switch twice (with 3-second gaps)
   - After 2nd violation:
     - Verify console: `Violation threshold reached (2/2) - ending exam`
     - Verify toast: `Exam ended: 2 violations detected`
     - Verify exam auto-submits
     - Verify redirect to dashboard

4. **Check Database**:
```sql
SELECT auto_ended, violation_count, status 
FROM exam_attempts 
ORDER BY created_at DESC 
LIMIT 1;
```
   - Verify: `auto_ended = true`
   - Verify: `violation_count = 2`
   - Verify: `status = 'completed'`

## Troubleshooting

### Microphone Not Working

**Check 1: Browser Permissions**
- Open browser settings
- Check microphone permissions for localhost
- Ensure microphone is not blocked

**Check 2: Console Logs**
```javascript
// Should see in console:
"Audio monitoring: { noiseLevel: 'X%', speechDetected: false, threshold: '15%' }"

// If noiseLevel always 0%:
// - Microphone not initialized
// - Check for errors in console
// - Try different browser
```

**Check 3: Audio Context**
```javascript
// In browser console during exam:
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Microphone working:', stream))
  .catch(err => console.error('Microphone error:', err));
```

**Check 4: Sensitivity**
- If violations trigger too easily, increase thresholds:
  - `HIGH_NOISE_THRESHOLD`: 0.15 → 0.20
  - `recentSpeech.length > 3`: Change to `> 5`
- If violations don't trigger, decrease thresholds:
  - `HIGH_NOISE_THRESHOLD`: 0.15 → 0.10
  - `recentSpeech.length > 3`: Change to `> 2`

### System Settings Not Loading

**Check Database**:
```sql
SELECT * FROM system_settings;
```

**If Empty**:
```sql
INSERT INTO system_settings (
  violation_threshold,
  gaze_sensitivity,
  audio_sensitivity,
  face_missing_timeout
) VALUES (3, 0.7, 0.2, 5);
```

**Check Console**:
- Should see: `System settings loaded: {...}`
- If not, check RLS policies on `system_settings` table

### Auto-Submit Not Working

**Check Console Logs**:
```
"Violation recorded: {...}"
"Total violations: X/Y"
"Violation threshold reached (X/Y) - ending exam"
"Exam ending: Y violations detected"
"Submitting exam..."
```

**If Missing Logs**:
- Proctoring engine not initialized
- Check for errors during `engine.start()`
- Verify video and canvas elements exist

**If Logs Present But No Submit**:
- Check `isSubmitting` flag
- Check for errors in `handleSubmit()`
- Verify database update succeeds

## Performance Notes

### Audio Detection Sensitivity

Current settings are **moderately sensitive**:
- Will detect normal speech
- Will detect loud typing/clicking
- May trigger on background noise

**To Adjust**:
- **More Strict** (fewer false positives):
  - Increase `HIGH_NOISE_THRESHOLD` to 0.20-0.25
  - Increase `recentSpeech.length > 3` to `> 5`
  - Increase `SPEECH_DURATION_THRESHOLD` to 3000

- **More Lenient** (fewer false negatives):
  - Decrease `HIGH_NOISE_THRESHOLD` to 0.10-0.12
  - Decrease `recentSpeech.length > 3` to `> 2`
  - Decrease `SPEECH_DURATION_THRESHOLD` to 1500

### Database Settings

Recommended values for different strictness levels:

**Strict Mode**:
```sql
UPDATE system_settings SET
  violation_threshold = 2,
  audio_sensitivity = 0.10,
  gaze_sensitivity = 0.15,
  face_missing_timeout = 3;
```

**Normal Mode** (Recommended):
```sql
UPDATE system_settings SET
  violation_threshold = 3,
  audio_sensitivity = 0.15,
  gaze_sensitivity = 0.20,
  face_missing_timeout = 5;
```

**Lenient Mode**:
```sql
UPDATE system_settings SET
  violation_threshold = 5,
  audio_sensitivity = 0.20,
  gaze_sensitivity = 0.25,
  face_missing_timeout = 8;
```

## Files Modified

1. `client/app/student/exam/[id]/page.tsx`
   - Load system settings from database
   - Use dynamic violation threshold
   - Update UI to show correct threshold

2. `client/proctoring/proctoringEngine.ts`
   - Add `getViolationThreshold()` method
   - Use threshold from config

3. `client/proctoring/audioDetector.ts`
   - Lowered all detection thresholds
   - Added debug logging
   - Increased sensitivity across the board

## Summary

All issues are now fixed:
- ✅ System settings loaded from database
- ✅ Violation threshold dynamic (not hardcoded)
- ✅ Microphone detection highly sensitive
- ✅ Auto-submit works at correct threshold
- ✅ Debug logging for troubleshooting
- ✅ UI shows correct threshold values

Test thoroughly with different threshold values to ensure everything works!
