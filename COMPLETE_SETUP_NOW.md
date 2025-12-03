# Complete Setup - Do This Now!

## 🚀 Quick Setup (5 Minutes)

### Step 1: Apply Database Migration (REQUIRED)

Open Supabase SQL Editor and run:

```sql
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

**Why**: These columns store the audio recordings

### Step 2: Restart Development Server

```bash
cd client
npm run dev
```

**Why**: Load the fixed code

### Step 3: Clear Browser Cache

- Press `Ctrl + Shift + R` (hard reload)
- Or `Ctrl + Shift + Delete` → Clear cache

**Why**: Remove old cached code

### Step 4: Test It!

1. **Login as student**
2. **Start an exam**
3. **Grant camera + microphone permissions**
4. **Trigger violations**:
   - Look left/right for 3 seconds
   - Speak loudly: "Testing audio"
   - Cover camera for 5 seconds

5. **Check browser console** (F12):
```
✅ Proctoring engine started successfully
✅ AudioRecorder initialized successfully
⚠️ Violation detected
📸 Capturing snapshot for violation: gaze_sideward
✅ Snapshot captured, size: XX KB
🎙️ Audio recording completed: 3000ms, size: XX KB
💾 Violation saved to database
```

6. **Login as teacher**
7. **Go to exam reports**
8. **Click "Evidence" button** (should now appear!)
9. **Verify**:
   - Modal opens ✅
   - Snapshots show ✅
   - Audio player appears ✅
   - Can play audio ✅

## ✅ What Was Fixed

### Issue 1: No Evidence Button
**Cause**: Violations weren't capturing snapshots
**Fix**: Changed `requiresSnapshot: false` → `requiresSnapshot: true`
**Status**: ✅ FIXED

### Issue 2: No Audio Recording
**Cause**: Database columns didn't exist
**Fix**: Apply migration (Step 1 above)
**Status**: ⏳ NEEDS MIGRATION

### Issue 3: Gaze Snapshots Not Showing
**Cause**: Same as Issue 1
**Fix**: Same as Issue 1
**Status**: ✅ FIXED

## 📊 Verification Checklist

After completing steps above:

- [ ] Database migration applied
- [ ] Server restarted
- [ ] Browser cache cleared
- [ ] Can start exam
- [ ] Camera permission granted
- [ ] Microphone permission granted
- [ ] Console shows "AudioRecorder initialized"
- [ ] Violations trigger when looking away
- [ ] Violations trigger when speaking
- [ ] Console shows "Capturing snapshot"
- [ ] Console shows "Audio recording completed"
- [ ] "Evidence" button appears in reports
- [ ] Modal opens when clicked
- [ ] Snapshots display
- [ ] Audio player appears
- [ ] Can play audio recordings

## 🎯 Expected Behavior

### During Exam (Student)
```
1. Start exam
2. Look left → Warning appears
3. Console: "📸 Capturing snapshot"
4. Speak → Warning appears  
5. Console: "🎙️ Audio recording completed"
6. Violation count increases
```

### In Reports (Teacher)
```
1. Open reports
2. See attempt with violations
3. "Evidence" button visible
4. Click button
5. Modal shows:
   - Violation #1: Gaze Sideward
     - Snapshot image
     - Timestamp
   - Violation #2: Audio Speech
     - Snapshot image
     - Audio player (3 seconds)
     - Peak level: XX%
```

## 🐛 Troubleshooting

### "Evidence" Button Still Not Showing

**Check 1**: Did you restart the server?
```bash
cd client
npm run dev
```

**Check 2**: Did you clear browser cache?
- Hard reload: `Ctrl + Shift + R`

**Check 3**: Are violations being created?
```sql
SELECT COUNT(*) FROM violations;
```

**Check 4**: Do violations have snapshots?
```sql
SELECT 
  COUNT(*) as total,
  COUNT(snapshot_url) as with_snapshots
FROM violations;
```

If `with_snapshots` is 0, the code didn't update. Try:
1. Close all browser tabs
2. Restart dev server
3. Hard reload page

### Audio Not Recording

**Check 1**: Did you apply the migration?
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'violations' 
AND column_name = 'audio_recording';
```

Should return: `audio_recording`

**Check 2**: Is microphone permission granted?
- Check browser address bar for mic icon
- Click and ensure "Allow"

**Check 3**: Is audio sensitivity > 0?
```sql
SELECT audio_sensitivity FROM system_settings;
```

Should be > 0 (default: 0.6 or 0.15)

### Snapshots Not Showing

**Check 1**: Is camera permission granted?
- Check browser address bar for camera icon

**Check 2**: Is video element working?
- You should see yourself in the exam page

**Check 3**: Check console for errors
- Open F12 and look for red errors

## 📝 Quick Test Script

Run this in browser console during exam:

```javascript
// Check if proctoring is active
console.log('Active:', window.proctoringEngine?.isActive);

// Check violation count
console.log('Violations:', window.proctoringEngine?.getViolationCount());

// Trigger test violation (speak loudly for 3 seconds)
// Then check database:
```

```sql
SELECT * FROM violations 
ORDER BY detected_at DESC 
LIMIT 1;
```

## 🎉 Success!

If you can:
1. ✅ See "Evidence" button
2. ✅ Open modal with violations
3. ✅ See snapshot images
4. ✅ Play audio recordings

**Then everything is working!** 🎊

## 📚 Documentation

- **FIXED_EVIDENCE_ISSUE.md** - What was fixed
- **AUDIO_RECORDING_FEATURE.md** - Complete feature docs
- **VERIFY_SETUP.md** - Detailed verification
- **DEBUG_AUDIO_ISSUE.md** - Troubleshooting guide

## 🚀 Next Steps

1. ✅ Complete setup above
2. ✅ Test thoroughly
3. ✅ Train teachers on evidence review
4. ✅ Deploy to production
5. ✅ Monitor storage usage

## ⚡ TL;DR

```bash
# 1. Run in Supabase SQL Editor:
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;

# 2. Restart server:
cd client && npm run dev

# 3. Clear cache: Ctrl+Shift+R

# 4. Test exam → Trigger violations → Check reports

# Done! ✅
```

---

**Status**: Ready to test!
**Time**: 5 minutes
**Difficulty**: Easy

**Go ahead and test it now!** 🚀
