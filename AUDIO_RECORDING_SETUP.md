# Audio Recording Setup Guide

## Quick Setup

### 1. Update Database Schema
Run the migration to add audio recording columns:

```bash
# Using Supabase CLI
supabase db push supabase/add_audio_recordings.sql

# Or manually in Supabase SQL Editor
```

Copy and paste this SQL:
```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;

COMMENT ON COLUMN violations.audio_recording IS 'Base64 encoded audio snippet (3-5 seconds) captured during audio violation';
COMMENT ON COLUMN violations.audio_duration IS 'Duration of audio recording in milliseconds';
COMMENT ON COLUMN violations.audio_level IS 'Audio level (0.0-1.0) at time of violation';
```

### 2. Test the Feature

#### As a Student:
1. Start an exam
2. Grant microphone permissions
3. Speak or make noise during the exam
4. Check console for "Audio violation detected - starting audio recording"
5. Verify violation is logged

#### As a Teacher:
1. Go to exam reports
2. Find an attempt with audio violations
3. Click "Evidence" button
4. Verify audio player appears with recordings
5. Play the audio to hear the violation

### 3. Configure Sensitivity

In Admin Dashboard → System Settings:
- **Audio Sensitivity**: 0.15 (default)
  - Lower = less sensitive (allows more noise)
  - Higher = more sensitive (stricter detection)

### 4. Verify Installation

Check browser console during exam:
```
✅ AudioRecorder initialized successfully
✅ Audio violation detected - starting audio recording
✅ Audio recording completed: duration: 3000ms, size: 42.5 KB
✅ Violation saved to database
```

## Features Enabled

✅ Automatic 3-second audio recording on violations
✅ Base64 storage in database
✅ Audio playback in teacher reports
✅ Audio level and duration metadata
✅ Synchronized with camera snapshots
✅ Browser-native recording (no external dependencies)

## Browser Requirements

- Chrome/Edge 49+
- Firefox 25+
- Safari 14.1+
- Microphone permission required

## Storage Estimates

- **Per Recording**: ~40 KB (3 seconds)
- **Per Exam** (3 violations): ~120 KB
- **100 Students**: ~12 MB
- **1000 Students**: ~120 MB

## Troubleshooting

### Audio Not Recording
```javascript
// Check in browser console:
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Microphone access granted'))
  .catch(err => console.error('❌ Microphone error:', err));
```

### Audio Not Playing
- Check if base64 data exists in database
- Try different browser
- Check browser audio codec support

### Database Error
```sql
-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'violations' 
AND column_name IN ('audio_recording', 'audio_duration', 'audio_level');
```

## Testing Checklist

- [ ] Database migration applied
- [ ] Student can start exam with microphone
- [ ] Audio violations trigger recording
- [ ] Recordings saved to database
- [ ] Teacher can view recordings in reports
- [ ] Audio playback works in browser
- [ ] Audio level displayed correctly
- [ ] Multiple recordings per attempt work

## Next Steps

1. Test with real students
2. Monitor database storage usage
3. Adjust audio sensitivity as needed
4. Review violation evidence regularly
5. Consider implementing audio cleanup policy

## Support

For issues or questions:
1. Check browser console for errors
2. Verify microphone permissions
3. Test in different browser
4. Check database schema
5. Review AUDIO_RECORDING_FEATURE.md for details
