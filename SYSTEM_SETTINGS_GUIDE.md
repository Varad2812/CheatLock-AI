# System Settings Integration Guide

## Overview

System settings from the database now control proctoring behavior in real-time.

## Settings Explained

### 1. Violation Threshold
**Database Column**: `violation_threshold`  
**Type**: Integer  
**Default**: 3  
**Range**: 1-10  

**What it does**: Number of violations before exam auto-ends

**Examples**:
- `1` = Very strict (1 violation = exam ends)
- `3` = Normal (3 violations = exam ends)
- `5` = Lenient (5 violations = exam ends)
- `10` = Very lenient

### 2. Audio Sensitivity
**Database Column**: `audio_sensitivity`  
**Type**: Float (0.0 - 1.0)  
**Default**: 0.15 (15%)  
**Range**: 0.0 - 1.0  

**What it does**: Noise level threshold for audio violations

**How it works**:
- `0.0` = **DISABLED** - No audio detection
- `0.05` = Very lenient (only very loud noises)
- `0.15` = Normal (moderate sensitivity)
- `0.25` = Strict (detects quiet sounds)
- `0.50` = Very strict (detects whispers)

**Examples**:
```sql
-- Disable audio detection completely
UPDATE system_settings SET audio_sensitivity = 0;

-- Very lenient (only loud talking/shouting)
UPDATE system_settings SET audio_sensitivity = 0.25;

-- Normal (normal speaking volume)
UPDATE system_settings SET audio_sensitivity = 0.15;

-- Strict (quiet talking)
UPDATE system_settings SET audio_sensitivity = 0.08;
```

### 3. Gaze Sensitivity
**Database Column**: `gaze_sensitivity`  
**Type**: Float (0.0 - 1.0)  
**Default**: 0.20 (20%)  
**Range**: 0.0 - 1.0  

**What it does**: How easily gaze violations are triggered

**How it works**:
- `0.0` = **DISABLED** - No gaze detection
- `0.10` = Very lenient (must look away for long time)
- `0.20` = Normal (moderate off-screen detection)
- `0.30` = Strict (quick glances detected)
- `0.50` = Very strict (any eye movement)

**Formula**: `threshold = 5 - (sensitivity × 10)`
- 0.20 sensitivity = 3 detections needed
- 0.30 sensitivity = 2 detections needed
- 0.10 sensitivity = 4 detections needed

**Examples**:
```sql
-- Disable gaze detection completely
UPDATE system_settings SET gaze_sensitivity = 0;

-- Very lenient (allow looking around)
UPDATE system_settings SET gaze_sensitivity = 0.10;

-- Normal (moderate detection)
UPDATE system_settings SET gaze_sensitivity = 0.20;

-- Strict (minimal looking away)
UPDATE system_settings SET gaze_sensitivity = 0.35;
```

### 4. Face Missing Timeout
**Database Column**: `face_missing_timeout`  
**Type**: Integer (seconds)  
**Default**: 5  
**Range**: 1-30  

**What it does**: How long face can be missing before violation

**Examples**:
- `3` = Strict (3 seconds without face = violation)
- `5` = Normal (5 seconds without face = violation)
- `10` = Lenient (10 seconds without face = violation)
- `30` = Very lenient (30 seconds allowed)

```sql
-- Strict (quick detection)
UPDATE system_settings SET face_missing_timeout = 3;

-- Normal
UPDATE system_settings SET face_missing_timeout = 5;

-- Lenient (allow bathroom breaks)
UPDATE system_settings SET face_missing_timeout = 15;
```

## How to Update Settings

### Method 1: SQL (Recommended)

```sql
-- View current settings
SELECT * FROM system_settings;

-- Update all settings at once
UPDATE system_settings SET
  violation_threshold = 5,
  audio_sensitivity = 0.15,
  gaze_sensitivity = 0.20,
  face_missing_timeout = 5;

-- Update individual settings
UPDATE system_settings SET audio_sensitivity = 0;  -- Disable audio
UPDATE system_settings SET gaze_sensitivity = 0;   -- Disable gaze
UPDATE system_settings SET violation_threshold = 10; -- Very lenient
```

### Method 2: Admin Dashboard (Future)

An admin interface can be built to update these settings via UI.

## Preset Configurations

### Strict Mode (High Security Exam)
```sql
UPDATE system_settings SET
  violation_threshold = 2,
  audio_sensitivity = 0.10,
  gaze_sensitivity = 0.30,
  face_missing_timeout = 3;
```

### Normal Mode (Standard Exam)
```sql
UPDATE system_settings SET
  violation_threshold = 3,
  audio_sensitivity = 0.15,
  gaze_sensitivity = 0.20,
  face_missing_timeout = 5;
```

### Lenient Mode (Practice/Low Stakes)
```sql
UPDATE system_settings SET
  violation_threshold = 5,
  audio_sensitivity = 0.20,
  gaze_sensitivity = 0.10,
  face_missing_timeout = 10;
```

### Disabled Mode (No Proctoring)
```sql
UPDATE system_settings SET
  violation_threshold = 999,
  audio_sensitivity = 0,
  gaze_sensitivity = 0,
  face_missing_timeout = 999;
```

## Testing Settings

### Test 1: Verify Settings Load

1. Update settings in database
2. Start exam
3. Check browser console for:
```
System settings loaded: { violation_threshold: 5, audio_sensitivity: 0.15, ... }
Violation threshold: 5
Audio sensitivity: 0.15
Gaze sensitivity: 0.20
Face missing timeout: 5
```

### Test 2: Verify Audio Sensitivity

**Set to 0 (Disabled)**:
```sql
UPDATE system_settings SET audio_sensitivity = 0;
```
- Start exam
- Speak loudly
- **Expected**: No audio violations

**Set to 0.25 (Lenient)**:
```sql
UPDATE system_settings SET audio_sensitivity = 0.25;
```
- Start exam
- Speak normally
- **Expected**: No violations (threshold too high)
- Shout loudly
- **Expected**: Violation triggered

**Set to 0.08 (Strict)**:
```sql
UPDATE system_settings SET audio_sensitivity = 0.08;
```
- Start exam
- Whisper quietly
- **Expected**: Violation triggered

### Test 3: Verify Gaze Sensitivity

**Set to 0 (Disabled)**:
```sql
UPDATE system_settings SET gaze_sensitivity = 0;
```
- Start exam
- Look away from screen
- **Expected**: No gaze violations

**Set to 0.10 (Lenient)**:
```sql
UPDATE system_settings SET gaze_sensitivity = 0.10;
```
- Start exam
- Look left/right briefly
- **Expected**: No violations (threshold = 4 detections)

**Set to 0.30 (Strict)**:
```sql
UPDATE system_settings SET gaze_sensitivity = 0.30;
```
- Start exam
- Glance left briefly
- **Expected**: Violation triggered quickly (threshold = 2 detections)

## Console Logs to Watch

When exam starts, you should see:
```
System settings loaded: { ... }
Violation threshold: 5
Audio sensitivity: 0.15
Gaze sensitivity: 0.2
Face missing timeout: 5
Proctoring engine initialized with settings: { ... }
GazeViolationDetector initialized: { gazeSensitivity: 0.2, faceMissingTimeout: '5s' }
AudioViolationDetector initialized: { audioSensitivity: 0.15, threshold: '15%' }
```

## Troubleshooting

### Settings Not Loading

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
) VALUES (3, 0.20, 0.15, 5);
```

### Settings Not Taking Effect

1. **Clear browser cache** and refresh
2. **Check console** for settings load logs
3. **Restart exam** (settings load on exam start)
4. **Verify RLS policies** allow reading system_settings

### Audio Still Detecting at 0 Sensitivity

- Check console for: `AudioViolationDetector initialized: { audioSensitivity: 0 }`
- If not 0, settings didn't load
- Refresh page and start new exam

### Gaze Still Detecting at 0 Sensitivity

- Check console for: `GazeViolationDetector initialized: { gazeSensitivity: 0 }`
- If not 0, settings didn't load
- Refresh page and start new exam

## Best Practices

1. **Test settings** before actual exams
2. **Start lenient** and increase strictness gradually
3. **Monitor false positives** and adjust accordingly
4. **Document your settings** for each exam type
5. **Communicate settings** to students beforehand

## Future Enhancements

- [ ] Per-exam settings override
- [ ] Admin UI for settings management
- [ ] Settings history/audit log
- [ ] A/B testing different sensitivity levels
- [ ] Machine learning to auto-tune settings
- [ ] Student feedback on false positives

## Summary

All system settings now work dynamically:
- ✅ Violation threshold controls auto-end
- ✅ Audio sensitivity controls noise detection (0 = disabled)
- ✅ Gaze sensitivity controls eye tracking (0 = disabled)
- ✅ Face missing timeout controls face detection delay
- ✅ Settings load from database on exam start
- ✅ No code changes needed to adjust behavior

Update the database and restart the exam to see changes!
