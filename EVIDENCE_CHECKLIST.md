# ✅ EVIDENCE FIX CHECKLIST

## Do These 10 Steps (5 Minutes)

### ☐ 1. Apply Migration
```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```
Run in Supabase SQL Editor

### ☐ 2. Verify Columns
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'violations' AND column_name LIKE '%audio%';
```
Should return: audio_duration, audio_level, audio_recording

### ☐ 3. Restart Server
```bash
cd client
npm run dev
```

### ☐ 4. Clear Browser Cache
`Ctrl + Shift + R` (hard reload)

### ☐ 5. Start NEW Exam
Don't use old exams! Start fresh.

### ☐ 6. Check Console
Should see:
- ✅ Proctoring engine started
- ✅ AudioRecorder initialized

### ☐ 7. Trigger Gaze Violation
Look away for 3 seconds.
Console should show:
- 📸 Capturing snapshot
- ✅ Snapshot captured

### ☐ 8. Trigger Audio Violation
Speak loudly for 3 seconds.
Console should show:
- 🎙️ Audio recording completed

### ☐ 9. Check Database
```sql
SELECT 
  violation_type,
  snapshot_url IS NOT NULL as has_snapshot,
  audio_recording IS NOT NULL as has_audio
FROM violations
ORDER BY detected_at DESC
LIMIT 5;
```
Both should be TRUE

### ☐ 10. Check Reports
- Evidence button shows
- Modal opens
- Snapshots display
- Audio plays

---

## Quick Debug

**If snapshots NULL**: Check console for "Capturing snapshot"
**If audio NULL**: Check if migration applied
**If Evidence button missing**: Refresh page

---

## Most Common Issue

**90% of problems**: Database migration not applied!

**Fix**: Run the ALTER TABLE command in Step 1

---

**Status**: Follow all 10 steps in order!
