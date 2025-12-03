# Audio Recording - Quick Reference

## 🎙️ What It Does
Automatically records 3-second audio snippets when students speak or make noise during exams.

## ⚡ Quick Setup
```bash
# 1. Apply database migration
supabase db push supabase/add_audio_recordings.sql

# 2. Test it
# - Start exam as student
# - Speak during exam
# - Check teacher reports for audio playback
```

## 📊 Key Stats
- **Recording Duration**: 3 seconds
- **File Size**: ~40 KB per recording
- **Format**: WebM/MP4 (browser-dependent)
- **Trigger**: Audio violations only
- **Storage**: Base64 in database

## 🎯 When It Records
✅ Student speaks during exam
✅ High noise detected (phone, talking)
✅ Sustained audio above threshold
❌ Normal background noise (allowed)
❌ Single cough or sneeze (allowed)

## 👀 Where to Find Recordings
1. Login as teacher
2. Go to exam reports
3. Click "Evidence" button
4. See audio player with recordings
5. Click play to hear violation

## ⚙️ Configuration
**Audio Sensitivity** (Admin Dashboard):
- `0.0` = Disabled
- `0.15` = Default (recommended)
- `0.3` = Less sensitive
- `0.6` = Very sensitive

## 🔧 Files Modified
- ✅ `client/proctoring/audioRecorder.ts` (new)
- ✅ `client/proctoring/proctoringEngine.ts` (updated)
- ✅ `client/app/teacher/exam/[id]/reports/page.tsx` (updated)
- ✅ `supabase/add_audio_recordings.sql` (new)

## 📱 Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile: ⚠️ Limited

## 🐛 Troubleshooting

### No Recording?
```javascript
// Check microphone permission
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ OK'))
  .catch(err => console.error('❌ Error:', err));
```

### No Playback?
- Check if audio data exists in database
- Try different browser
- Verify base64 encoding

### Database Error?
```sql
-- Verify columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'violations' 
AND column_name LIKE 'audio%';
```

## 💡 Pro Tips
1. **Test First**: Always test with a dummy exam
2. **Adjust Sensitivity**: Start with default (0.15)
3. **Monitor Storage**: ~40 KB per violation
4. **Review Evidence**: Listen to recordings before grading
5. **Privacy**: Inform students about audio recording

## 📈 Expected Behavior

### Console Output (Student)
```
✅ AudioRecorder initialized successfully
⚠️ Audio violation detected - starting audio recording
🎙️ Started audio recording for 3000ms
✅ Audio recording completed: 3000ms, 42.5 KB
💾 Violation saved to database
```

### UI (Teacher)
```
Reports → Evidence → Audio Player
▶️ Play button
━━━ Seek bar
🔊 Volume control
📊 Peak Level: 78%
⏱️ Duration: 3.0s
```

## 🎓 Use Cases

### ✅ Valid Violations
- Student asks classmate for help
- Phone conversation during exam
- Discussing answers with others
- Reading questions aloud

### ❌ False Positives (Rare)
- Loud cough (single, brief)
- Sneeze (single, brief)
- Chair squeak (brief)
- Background TV (if below threshold)

## 🔐 Security & Privacy
- ✅ Only records during violations (not continuous)
- ✅ Short duration (3 seconds)
- ✅ Encrypted storage (Supabase)
- ✅ Access restricted (teachers only)
- ✅ Auto-deleted with exam (CASCADE)

## 📞 Support
- Check console for errors
- Review `AUDIO_RECORDING_FEATURE.md` for details
- Test in different browser
- Verify database migration applied

## 🚀 Next Steps
1. Apply database migration
2. Test with dummy exam
3. Adjust sensitivity if needed
4. Train teachers on evidence review
5. Monitor storage usage

---

**Quick Test Command**:
```bash
# Check if feature is working
# 1. Start exam
# 2. Open console
# 3. Speak loudly
# 4. Look for: "Audio recording completed"
```

**Success Indicator**: 
✅ Audio player appears in teacher reports with playable recording

---

For complete documentation, see [AUDIO_RECORDING_FEATURE.md](AUDIO_RECORDING_FEATURE.md)
