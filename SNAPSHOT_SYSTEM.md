# Snapshot-Based Proctoring System

## Overview

The system has been updated to use **snapshot-based monitoring** instead of live video streaming. This approach:
- ✅ Saves bandwidth (no continuous streaming)
- ✅ Saves storage (only captures when violations occur)
- ✅ Works with Supabase free tier (no storage bucket needed)
- ✅ Stores snapshots as base64 in database
- ✅ Includes audio level data with snapshots

## Removed Features

### 1. Live Video Streaming (WebRTC)
- ❌ Removed `WebRTCStreamer` usage from student exam page
- ❌ Removed real-time video feed to examiners
- ❌ No longer requires Supabase storage bucket
- ❌ No longer requires `simple-peer` library

### 2. Examiner Role & Monitoring Dashboard
- ❌ Removed `/examiner/monitor/[examId]` page
- ❌ Removed real-time monitoring interface
- ❌ Removed live stream modal
- ❌ Examiner role can be removed from system

## New Snapshot System

### When Snapshots Are Captured

Snapshots are **only** captured for specific high-severity violations:

#### 1. Multiple Faces Detected (CRITICAL)
- **Trigger**: MediaPipe detects 2+ faces in frame
- **Severity**: 1.0 (maximum)
- **Description**: "X faces detected - unauthorized person present"
- **Snapshot**: ✅ Always captured
- **Use Case**: Detects someone helping the student

#### 2. Extreme Head Angles
- **Trigger**: Head angle > 50° or excessive downward tilt
- **Severity**: 0.85
- **Description**: "Extreme head angle detected (X°) - suspicious position"
- **Snapshot**: ✅ Always captured
- **Use Case**: Detects looking at phone/notes on lap or extreme positions
- **Note**: Normal rough sheet usage (< 45°) is allowed

#### 3. Audio/Speech Detection
- **Trigger**: Sustained speech or high noise levels
- **Severity**: 0.7-0.8
- **Description**: "Speech or talking detected" / "Excessive noise detected"
- **Snapshot**: ✅ Always captured with audio level
- **Audio Level**: Stored as percentage (0-100%)
- **Use Case**: Detects talking to someone or using voice assistants

#### 4. Regular Violations (No Snapshot)
- Tab switching
- Window blur
- Normal gaze violations (looking left/right)
- Face missing temporarily

### Snapshot Storage

```typescript
// Snapshots stored as base64 JPEG in database
{
  snapshot_url: "data:image/jpeg;base64,/9j/4AAQSkZJRg...", // ~50-100KB
  metadata: {
    audioLevel: 0.65 // If audio violation
  }
}
```

**Compression Settings:**
- Format: JPEG
- Quality: 0.6 (60%)
- Average size: 50-100 KB per snapshot
- Stored directly in `violations` table

### Database Schema Updates

```sql
-- New violation types added
CREATE TYPE violation_type AS ENUM (
  'gaze_sideward',
  'gaze_upward',
  'gaze_away',
  'face_missing',
  'multiple_faces',        -- NEW
  'extreme_head_angle',    -- NEW
  'audio_speech',
  'audio_external',
  'tab_switch',
  'window_blur',
  'copy_paste',
  'keystroke_anomaly',
  'multiple_devices'
);

-- Violations table (already has these columns)
CREATE TABLE violations (
  id UUID PRIMARY KEY,
  attempt_id UUID REFERENCES exam_attempts(id),
  violation_type violation_type NOT NULL,
  severity FLOAT,
  description TEXT,
  snapshot_url TEXT,           -- Base64 image
  metadata JSONB,              -- { audioLevel: 0.65 }
  detected_at TIMESTAMPTZ
);
```

## Rough Sheet Usage

### Allowed Angles
- **Downward gaze**: Up to 45° head tilt
- **Purpose**: Writing on rough sheet/paper
- **Detection**: `verticalOffset > 0.04 && headAngle < 45`
- **Result**: No violation triggered

### Extreme Angles (Violations)
- **Head angle > 50°**: Suspicious position
- **Excessive downward tilt**: Looking at lap/phone
- **Result**: Violation + snapshot captured

## Reports Integration

### PDF Reports
Reports now include:
1. Violation count with snapshots indicator
2. Audio levels for audio violations
3. Note: "[Snapshot captured - view in database]"

### Web Interface
Teachers can:
1. View all attempts in reports dashboard
2. Click "Snapshots" button to view captured images
3. See violation details with timestamps
4. View audio levels for audio violations
5. Download comprehensive PDF reports

### Snapshots Modal
- Grid view of all snapshots for an attempt
- Shows violation type, time, description
- Displays audio level if applicable
- Full-size image preview
- Organized chronologically

## Implementation Details

### Gaze Detector Updates

```typescript
interface GazeData {
  direction: 'center' | 'left' | 'right' | 'up' | 'down';
  headAngle: number;
  confidence: number;
  faceDetected: boolean;
  faceCount: number;        // NEW: Number of faces detected
  extremeAngle: boolean;    // NEW: Flag for extreme angles
}

// Multiple face detection
if (gazeData.faceCount > 1) {
  return {
    isViolation: true,
    type: 'multiple_faces',
    severity: 1.0,
    description: `${gazeData.faceCount} faces detected`,
    requiresSnapshot: true  // ALWAYS capture
  };
}

// Extreme angle detection
if (gazeData.extremeAngle) {
  return {
    isViolation: true,
    type: 'extreme_head_angle',
    severity: 0.85,
    description: `Extreme head angle (${angle}°)`,
    requiresSnapshot: true  // ALWAYS capture
  };
}
```

### Audio Detector Updates

```typescript
// Audio violations now include level and snapshot flag
if (speechDetected) {
  return {
    isViolation: true,
    type: 'audio_speech',
    severity: 0.8,
    description: 'Speech detected',
    requiresSnapshot: true,    // ALWAYS capture
    audioLevel: 0.65          // Include audio level
  };
}
```

### Proctoring Engine Updates

```typescript
// Conditional snapshot capture
private async handleViolation(
  violation: {...},
  requiresSnapshot: boolean = false,
  audioLevel?: number
) {
  // Only capture if required
  let snapshot: string | undefined;
  if (requiresSnapshot) {
    snapshot = await this.captureSnapshot(); // Returns base64
  }
  
  // Save with metadata
  await supabase.from('violations').insert({
    ...violation,
    snapshot_url: snapshot,
    metadata: audioLevel ? { audioLevel } : null
  });
}
```

## Storage Calculations

### Before (Live Streaming)
- Continuous video: ~500 Kbps per student
- 30-minute exam: ~112 MB per student
- 100 students: ~11 GB
- ❌ Exceeds free tier limits

### After (Snapshots Only)
- Average violations per exam: 2-3
- Snapshots per violation: 1-2 (only for critical ones)
- Average snapshot size: 75 KB
- Per student: ~150-225 KB
- 100 students: ~15-22 MB
- ✅ Well within free tier limits

## Testing Checklist

### Test 1: Multiple Faces Detection
1. Start exam
2. Have another person appear in camera frame
3. Verify:
   - ✅ Violation triggered immediately
   - ✅ Snapshot captured
   - ✅ Description shows "2 faces detected"
   - ✅ Severity = 1.0

### Test 2: Extreme Angle Detection
1. Start exam
2. Tilt head down > 50° (look at lap)
3. Verify:
   - ✅ Violation triggered
   - ✅ Snapshot captured
   - ✅ Description shows angle
   - ✅ Normal rough sheet usage (< 45°) allowed

### Test 3: Audio with Snapshot
1. Start exam
2. Speak or make loud noise for 3-4 seconds
3. Verify:
   - ✅ Violation triggered
   - ✅ Snapshot captured
   - ✅ Audio level stored in metadata
   - ✅ Shows in reports

### Test 4: Regular Violations (No Snapshot)
1. Start exam
2. Switch tabs
3. Look left/right briefly
4. Verify:
   - ✅ Violations triggered
   - ✅ NO snapshots captured
   - ✅ Database shows snapshot_url = null

### Test 5: Reports with Snapshots
1. Complete exam with violations
2. Go to teacher reports page
3. Click "Snapshots" button
4. Verify:
   - ✅ Modal opens with grid view
   - ✅ Images display correctly
   - ✅ Audio levels shown
   - ✅ Timestamps accurate

## Performance Impact

### Bandwidth
- **Before**: Continuous streaming = high bandwidth
- **After**: Only snapshot uploads = minimal bandwidth
- **Improvement**: ~99% reduction

### Storage
- **Before**: Video files in storage bucket
- **After**: Base64 in database
- **Improvement**: ~99% reduction in storage needs

### Processing
- **Before**: Continuous video encoding/decoding
- **After**: Occasional JPEG compression
- **Improvement**: Minimal CPU usage

## Security & Privacy

### Data Storage
- Snapshots stored as base64 in database
- No external storage bucket required
- Encrypted at rest (Supabase default)
- Access controlled by RLS policies

### Privacy Considerations
- Only captures during violations
- No continuous recording
- Students aware of monitoring
- Snapshots only for high-severity events

## Future Enhancements

### Potential Additions
1. **Snapshot Review Interface**: Allow teachers to flag false positives
2. **AI Analysis**: Use ML to analyze snapshots for additional insights
3. **Batch Export**: Export all snapshots for an exam as ZIP
4. **Comparison View**: Side-by-side comparison of multiple violations
5. **Anonymization**: Option to blur faces in exported reports

### Configuration Options
1. **Snapshot Quality**: Adjustable JPEG quality (0.4-0.8)
2. **Angle Thresholds**: Configurable rough sheet angle limits
3. **Audio Sensitivity**: Adjustable audio detection thresholds
4. **Selective Capture**: Choose which violation types capture snapshots

## Migration Notes

### Removed Dependencies
- Can remove `simple-peer` from package.json (if not used elsewhere)
- Can remove WebRTC-related code
- Can remove examiner monitoring pages

### Database Migration
```sql
-- Add new violation types (if not already present)
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'multiple_faces';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'extreme_head_angle';

-- Metadata column should already exist
-- If not, add it:
ALTER TABLE violations ADD COLUMN IF NOT EXISTS metadata JSONB;
```

### Cleanup
1. Remove `/client/app/examiner` folder
2. Remove `/client/utils/webrtc.ts` (if not needed)
3. Update navigation to remove examiner links
4. Remove examiner role from user registration

## Support

### Common Issues

**Snapshots not capturing:**
- Check browser console for errors
- Verify canvas element exists
- Check video element has valid stream

**Images too large:**
- Reduce JPEG quality in `captureSnapshot()`
- Current: 0.6 (60%)
- Can reduce to 0.4 (40%) if needed

**Multiple faces not detected:**
- Ensure good lighting
- Check MediaPipe is loading correctly
- Verify face mesh model is initialized

## Conclusion

The snapshot-based system provides:
- ✅ Efficient storage usage
- ✅ Bandwidth optimization
- ✅ Targeted violation evidence
- ✅ Privacy-conscious monitoring
- ✅ Free tier compatibility
- ✅ Comprehensive reporting

All while maintaining effective proctoring capabilities!
