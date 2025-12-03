# Audio Recording Feature

## Overview
The CheatLock AI proctoring system now captures **audio snippets** when audio violations are detected, providing concrete evidence of audio-based cheating attempts.

## How It Works

### 1. Audio Detection
- The system continuously monitors audio levels using the microphone
- When high volume or speech is detected, the audio violation detector triggers
- Configurable sensitivity through system settings (0.0 - 1.0)

### 2. Audio Recording
When an audio violation is detected:
- **Automatic Recording**: A 3-second audio snippet is automatically recorded
- **Synchronized Capture**: The recording captures the actual violation moment
- **Snapshot Integration**: Audio recordings are paired with camera snapshots
- **Metadata Storage**: Audio level, duration, and timestamp are saved

### 3. Storage
- Audio is encoded as **base64** and stored in the database
- Format: WebM or MP4 (browser-dependent)
- Typical size: 30-50 KB per 3-second snippet
- Stored in `violations` table with columns:
  - `audio_recording`: Base64 encoded audio
  - `audio_duration`: Duration in milliseconds
  - `audio_level`: Peak audio level (0.0-1.0)

### 4. Playback
Teachers can:
- View all violations with evidence in the reports page
- Click "Evidence" button to see snapshots and audio recordings
- Play audio recordings directly in the browser
- See audio level and duration metadata

## Technical Implementation

### Components

#### 1. AudioRecorder (`client/proctoring/audioRecorder.ts`)
```typescript
- initialize(stream): Setup audio recording
- startRecording(duration, audioLevel): Record audio snippet
- blobToBase64(blob): Convert audio to base64 for storage
- base64ToBlob(base64): Convert back for playback
```

#### 2. ProctoringEngine Integration
- Initializes audio recorder with microphone stream
- Triggers recording when audio violation detected
- Saves recording to database with violation
- Cleans up resources on exam end

#### 3. Database Schema
```sql
ALTER TABLE violations 
ADD COLUMN audio_recording TEXT,
ADD COLUMN audio_duration INTEGER,
ADD COLUMN audio_level FLOAT;
```

### Recording Parameters
- **Duration**: 3 seconds (configurable)
- **Bitrate**: 128 kbps
- **Format**: audio/webm (fallback to audio/mp4)
- **Trigger**: Audio violations only (speech or high noise)

## Benefits

### For Teachers
- **Concrete Evidence**: Actual audio proof of violations
- **Better Assessment**: Understand the nature of audio violations
- **Fair Evaluation**: Make informed decisions about cheating

### For System
- **Selective Recording**: Only records during violations (saves storage)
- **Efficient Storage**: Base64 encoding, ~40KB per recording
- **Browser-Native**: No external dependencies required

## Privacy & Security

### Privacy Considerations
- Audio is only recorded during detected violations
- Recordings are short (3 seconds) and targeted
- Students are informed about audio monitoring
- Data is encrypted in transit and at rest

### Security
- Audio stored in secure Supabase database
- Access restricted to teachers and admins
- Base64 encoding prevents direct file access
- Automatic cleanup with exam deletion (CASCADE)

## Usage Example

### For Students
1. Start exam with camera and microphone permissions
2. System monitors audio continuously
3. If violation detected (speech/noise):
   - 3-second audio snippet recorded
   - Camera snapshot captured
   - Violation logged with evidence

### For Teachers
1. Navigate to exam reports
2. Click "Evidence" button for any attempt
3. View violations with snapshots and audio
4. Play audio recordings to verify violations
5. Make informed grading decisions

## Configuration

### System Settings
Adjust audio sensitivity in admin dashboard:
- **0.0**: Audio detection disabled
- **0.15**: Default (balanced)
- **0.3**: Less sensitive (allows more noise)
- **0.6**: More sensitive (strict)

### Recording Duration
Default: 3000ms (3 seconds)
Can be adjusted in `audioRecorder.ts`:
```typescript
await this.audioRecorder.startRecording(3000, audioLevel);
```

## Browser Compatibility
- Chrome/Edge: ✅ Full support (audio/webm)
- Firefox: ✅ Full support (audio/webm)
- Safari: ✅ Full support (audio/mp4)
- Mobile browsers: ⚠️ Limited (depends on device)

## Performance Impact
- **CPU**: Minimal (native MediaRecorder API)
- **Memory**: ~1-2 MB per recording (temporary)
- **Storage**: ~40 KB per violation in database
- **Network**: Only uploads during violation save

## Future Enhancements
- [ ] Configurable recording duration
- [ ] Audio waveform visualization
- [ ] Speech-to-text transcription
- [ ] Audio quality indicators
- [ ] Batch download of all recordings
- [ ] Audio compression options

## Troubleshooting

### No Audio Recording
- Check microphone permissions
- Verify browser supports MediaRecorder
- Check console for errors
- Ensure audio sensitivity > 0

### Audio Not Playing
- Check browser audio codec support
- Try different browser
- Verify base64 data is valid
- Check audio element controls

### Large Database Size
- Reduce recording duration
- Increase audio sensitivity threshold
- Implement automatic cleanup policy
- Use audio compression

## Migration

To add this feature to existing database:
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/add_audio_recordings.sql
```

Or in Supabase SQL Editor:
```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

## Summary
The audio recording feature provides teachers with concrete evidence of audio violations, making the proctoring system more reliable and fair. It's efficient, privacy-conscious, and seamlessly integrated into the existing violation detection workflow.
