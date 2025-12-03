# Audio Recording Feature - Test Script

## Pre-Test Checklist

- [ ] Database migration applied (`supabase/add_audio_recordings.sql`)
- [ ] Development server running (`npm run dev`)
- [ ] Browser with microphone support (Chrome/Firefox/Safari)
- [ ] Test user accounts created (teacher + student)
- [ ] Test exam created and activated

## Test 1: Database Schema Verification

### Steps
1. Open Supabase SQL Editor
2. Run this query:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'violations' 
AND column_name IN ('audio_recording', 'audio_duration', 'audio_level')
ORDER BY column_name;
```

### Expected Result
```
column_name      | data_type | is_nullable
-----------------+-----------+-------------
audio_duration   | integer   | YES
audio_level      | double    | YES
audio_recording  | text      | YES
```

### Status: [ ] PASS [ ] FAIL

---

## Test 2: Microphone Permission

### Steps
1. Open browser console
2. Run this code:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Microphone error:', err));
```

### Expected Result
```
✅ Microphone access granted
```

### Status: [ ] PASS [ ] FAIL

---

## Test 3: Audio Recorder Initialization

### Steps
1. Login as student
2. Start an exam
3. Grant camera and microphone permissions
4. Open browser console
5. Look for initialization messages

### Expected Console Output
```
✅ Proctoring engine started successfully
✅ AudioRecorder initialized successfully
📊 Audio monitoring: noiseLevel: X%, speechDetected: false
```

### Status: [ ] PASS [ ] FAIL

---

## Test 4: Audio Violation Detection

### Steps
1. Continue from Test 3 (exam in progress)
2. Speak clearly: "Testing audio recording feature"
3. Wait 3-5 seconds
4. Check console for violation messages

### Expected Console Output
```
⚠️ Audio violation detected - starting audio recording
🎙️ Started audio recording for 3000ms
📸 Capturing snapshot for violation: audio_speech
✅ Audio recording completed: duration: 3000ms, size: ~40KB
💾 Saving violation to database
✅ Violation saved to database
📈 Violation count updated in database: 1
🚨 Violation 1/3: {
  type: 'audio_speech',
  severity: 0.8,
  description: 'Speech or talking detected - maintain silence',
  audioLevel: 0.XX
}
```

### Expected UI
- Violation counter increases: "Violations: 1/3"
- Warning message appears

### Status: [ ] PASS [ ] FAIL

---

## Test 5: Database Storage Verification

### Steps
1. After Test 4, get the attempt ID from console or database
2. Run this query in Supabase SQL Editor:
```sql
SELECT 
  id,
  violation_type,
  severity,
  description,
  LENGTH(audio_recording) as audio_size_bytes,
  audio_duration,
  audio_level,
  detected_at
FROM violations
WHERE attempt_id = 'YOUR_ATTEMPT_ID'
AND audio_recording IS NOT NULL
ORDER BY detected_at DESC
LIMIT 1;
```

### Expected Result
```
violation_type: audio_speech
severity: 0.8
audio_size_bytes: ~50000-60000 (base64 encoded)
audio_duration: 3000
audio_level: 0.XX (between 0.15 and 1.0)
```

### Status: [ ] PASS [ ] FAIL

---

## Test 6: Teacher Reports - Audio Playback

### Steps
1. Login as teacher
2. Navigate to exam reports
3. Find the student attempt from Test 4
4. Click "Evidence" button
5. Verify audio player appears

### Expected UI
```
┌─────────────────────────────────────────┐
│ 1. AUDIO_SPEECH                         │
│ [Timestamp]                             │
│ Speech or talking detected              │
│                                         │
│ [Camera Snapshot Image]                 │
│                                         │
│ 🔊 Audio Recording (3.0s)               │
│ ▶️ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 🔊  │
│ Peak Level: XX%                         │
└─────────────────────────────────────────┘
```

### Status: [ ] PASS [ ] FAIL

---

## Test 7: Audio Playback Functionality

### Steps
1. Continue from Test 6
2. Click the play button (▶️)
3. Listen to the audio
4. Verify you hear the recorded speech

### Expected Result
- Audio plays successfully
- You hear: "Testing audio recording feature"
- Audio quality is clear
- Duration is approximately 3 seconds

### Status: [ ] PASS [ ] FAIL

---

## Test 8: Multiple Violations

### Steps
1. Start a new exam as student
2. Speak 3 times with 10-second gaps:
   - "First violation"
   - "Second violation"
   - "Third violation"
3. Check console for 3 separate recordings
4. Verify exam auto-ends after 3rd violation

### Expected Console Output
```
🚨 Violation 1/3: audio_speech
[10 seconds later]
🚨 Violation 2/3: audio_speech
[10 seconds later]
🚨 Violation 3/3: audio_speech
⚠️ Violation threshold exceeded - ending exam
```

### Expected UI
- Exam auto-submits
- Redirect to dashboard
- Message: "Exam ended due to violations"

### Status: [ ] PASS [ ] FAIL

---

## Test 9: Multiple Audio Recordings in Reports

### Steps
1. Login as teacher
2. View reports for Test 8 attempt
3. Click "Evidence" button
4. Verify 3 audio recordings appear

### Expected Result
- 3 violation cards displayed
- Each has audio player
- Each audio is ~3 seconds
- Can play all 3 recordings

### Status: [ ] PASS [ ] FAIL

---

## Test 10: Audio Sensitivity Configuration

### Steps
1. Login as admin
2. Go to System Settings
3. Set Audio Sensitivity to 0.0 (disabled)
4. Save settings
5. Start exam as student
6. Speak loudly
7. Verify NO violation triggered

### Expected Result
- No audio violation detected
- No recording made
- Exam continues normally

### Steps (Part 2)
8. Set Audio Sensitivity to 0.6 (very sensitive)
9. Start new exam
10. Make slight noise (whisper)
11. Verify violation triggered

### Expected Result
- Audio violation detected even for quiet sounds
- Recording made
- Violation logged

### Status: [ ] PASS [ ] FAIL

---

## Test 11: Browser Compatibility

### Chrome/Edge
- [ ] Audio recording works
- [ ] Format: audio/webm
- [ ] Playback works

### Firefox
- [ ] Audio recording works
- [ ] Format: audio/webm
- [ ] Playback works

### Safari
- [ ] Audio recording works
- [ ] Format: audio/mp4
- [ ] Playback works

### Status: [ ] PASS [ ] FAIL

---

## Test 12: Error Handling

### Test 12a: No Microphone Permission
1. Start exam
2. Deny microphone permission
3. Verify graceful error handling

Expected: Error message, exam doesn't start

### Test 12b: Microphone Disconnected
1. Start exam with microphone
2. Disconnect/disable microphone mid-exam
3. Verify system handles it gracefully

Expected: Warning message, exam continues (no audio monitoring)

### Status: [ ] PASS [ ] FAIL

---

## Test 13: Performance Impact

### Steps
1. Start exam with audio recording enabled
2. Open browser Task Manager (Shift+Esc in Chrome)
3. Monitor CPU and memory usage
4. Trigger 3 audio violations
5. Check resource usage

### Expected Result
- CPU usage: < 10% increase
- Memory usage: < 50 MB increase
- No lag or freezing
- Smooth recording and playback

### Status: [ ] PASS [ ] FAIL

---

## Test 14: Storage Impact

### Steps
1. Create 10 audio violations
2. Check database size
3. Calculate average size per recording

### Expected Result
```sql
SELECT 
  COUNT(*) as total_recordings,
  AVG(LENGTH(audio_recording)) as avg_size_bytes,
  SUM(LENGTH(audio_recording)) as total_size_bytes
FROM violations
WHERE audio_recording IS NOT NULL;
```

Expected:
- Average size: 40,000-60,000 bytes (~40-60 KB)
- Total for 10: ~400-600 KB

### Status: [ ] PASS [ ] FAIL

---

## Test 15: Edge Cases

### Test 15a: Very Short Speech
1. Start exam
2. Say single word: "Hi"
3. Check if violation triggered

Expected: May or may not trigger (depends on duration)

### Test 15b: Continuous Speech
1. Start exam
2. Speak continuously for 10 seconds
3. Check how many violations triggered

Expected: 1-2 violations (not continuous recording)

### Test 15c: Background Music
1. Start exam
2. Play music in background
3. Check if violation triggered

Expected: Depends on volume and sensitivity

### Status: [ ] PASS [ ] FAIL

---

## Test 16: Cleanup and Deletion

### Steps
1. Create exam with violations (including audio)
2. Note violation IDs
3. Delete the exam
4. Check if violations deleted (CASCADE)

```sql
SELECT COUNT(*) 
FROM violations 
WHERE id IN ('violation_id_1', 'violation_id_2');
```

Expected: 0 (all deleted)

### Status: [ ] PASS [ ] FAIL

---

## Test Results Summary

### Total Tests: 16
- Passed: ___
- Failed: ___
- Skipped: ___

### Critical Issues
List any critical issues found:
1. 
2. 
3. 

### Minor Issues
List any minor issues found:
1. 
2. 
3. 

### Performance Notes
- CPU Impact: ___
- Memory Impact: ___
- Storage per Recording: ___
- Network Impact: ___

### Browser Compatibility
- Chrome: [ ] Working [ ] Issues
- Firefox: [ ] Working [ ] Issues
- Safari: [ ] Working [ ] Issues

### Overall Assessment
[ ] Ready for Production
[ ] Needs Minor Fixes
[ ] Needs Major Fixes

---

## Post-Test Actions

### If All Tests Pass
- [ ] Update documentation with test results
- [ ] Create production deployment plan
- [ ] Train teachers on audio evidence review
- [ ] Monitor storage usage in production

### If Tests Fail
- [ ] Document failures
- [ ] Create bug reports
- [ ] Fix issues
- [ ] Re-run failed tests
- [ ] Full regression test

---

## Sign-Off

**Tester Name**: ___________________
**Date**: ___________________
**Environment**: ___________________
**Browser**: ___________________
**Overall Result**: [ ] PASS [ ] FAIL

**Notes**:
_______________________________________
_______________________________________
_______________________________________

---

## Quick Test (5 Minutes)

If you just want to verify it works:

1. Apply migration: `supabase db push supabase/add_audio_recordings.sql`
2. Start exam as student
3. Speak during exam
4. Check console for "Audio recording completed"
5. Login as teacher
6. View reports → Click "Evidence"
7. Play audio recording

✅ If you hear your voice, it works!

---

For detailed documentation, see [AUDIO_RECORDING_FEATURE.md](AUDIO_RECORDING_FEATURE.md)
