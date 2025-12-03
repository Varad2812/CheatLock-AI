# EMERGENCY FIX - Evidence Not Showing

## The Problem
Evidence button is not showing because violations don't have snapshots or audio recordings saved.

## IMMEDIATE FIX - Run These Commands NOW

### Step 1: Check Database (Run in Supabase SQL Editor)

```sql
-- Check if violations exist
SELECT 
  id,
  violation_type,
  snapshot_url,
  audio_recording,
  detected_at
FROM violations
ORDER BY detected_at DESC
LIMIT 5;
```

**If snapshot_url and audio_recording are NULL**, that's the problem!

### Step 2: Apply Migration (Run in Supabase SQL Editor)

```sql
-- Add audio columns if missing
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;
```

### Step 3: Force Evidence Button to Always Show (TEMPORARY FIX)

Replace the Evidence button code to always show:

Open: `client/app/teacher/exam/[id]/reports/page.tsx`

Find line ~296 and replace:

```typescript
// BEFORE (conditional)
{attempt.violations.some(v => v.snapshot_url || (v as any).audio_recording) && (
  <button>Evidence</button>
)}

// AFTER (always show if violations exist)
{attempt.violations.length > 0 && (
  <button>Evidence</button>
)}
```

### Step 4: Restart Everything

```bash
# Kill the dev server (Ctrl+C)
cd client
npm run dev
```

### Step 5: Clear Browser Cache
- Press `Ctrl + Shift + Delete`
- Clear "Cached images and files"
- Close all tabs
- Reopen

### Step 6: Test New Exam

1. **Start a BRAND NEW exam** (not old one)
2. Grant camera + mic permissions
3. Look away for 3 seconds
4. Speak loudly for 3 seconds
5. Check browser console (F12):

```
✅ Capturing snapshot for violation
✅ Audio recording completed
✅ Violation saved to database
```

6. Go to reports
7. Evidence button should show
8. Click it
9. See snapshots and audio

## If Still Not Working

### Nuclear Option: Force Show Evidence

Replace the entire Actions column in reports page:

```typescript
<td className="px-6 py-4">
  <div className="flex gap-2">
    <button
      onClick={() => generateReport(attempt)}
      disabled={generatingReport === attempt.id}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
    >
      {generatingReport === attempt.id ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Generating...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Report
        </>
      )}
    </button>
    {/* ALWAYS SHOW EVIDENCE BUTTON */}
    <button
      onClick={() => setSelectedAttempt(attempt)}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
    >
      <Eye className="w-4 h-4" />
      Evidence ({attempt.violations.length})
    </button>
  </div>
</td>
```

This will ALWAYS show the Evidence button with violation count.

## Debug: Check What's in Database

```sql
-- Check violations
SELECT 
  v.id,
  v.violation_type,
  v.severity,
  v.description,
  LENGTH(v.snapshot_url) as snapshot_size,
  LENGTH(v.audio_recording) as audio_size,
  v.detected_at,
  ea.student_id
FROM violations v
JOIN exam_attempts ea ON v.attempt_id = ea.id
ORDER BY v.detected_at DESC
LIMIT 10;
```

**Expected:**
- `snapshot_size` should be > 0 (like 50000)
- `audio_size` should be > 0 for audio violations (like 40000)

**If both are NULL:**
- Snapshots aren't being captured
- Audio isn't being recorded
- Check browser console for errors

## Quick Fix Code

I'll create the fix for you now...
