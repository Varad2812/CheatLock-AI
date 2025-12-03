# Snapshot Troubleshooting Guide

## Issue: Snapshots not being recorded for face tilt

Based on your logs, snapshots ARE being captured but failing to save to database with 400 errors.

## Step 1: Check Violation Types in Database

Run this in Supabase SQL Editor:

```sql
-- Check what violation types exist
SELECT enumlabel as violation_type 
FROM pg_enum 
WHERE enumtypid = 'violation_type'::regtype
ORDER BY enumlabel;
```

**Expected to see**:
- `extreme_head_angle` ← Must be present
- `multiple_faces` ← Must be present
- All other types (audio_speech, tab_switch, etc.)

**If missing**, run:
```sql
-- Add missing types
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'extreme_head_angle';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'multiple_faces';
```

Or run the file: `supabase/fix_violation_types.sql`

## Step 2: Check Violations Table

```sql
-- Check recent violations
SELECT 
  id,
  violation_type,
  description,
  CASE 
    WHEN snapshot_url IS NULL THEN 'No snapshot'
    WHEN snapshot_url LIKE 'data:image%' THEN 'Has snapshot (' || LENGTH(snapshot_url) || ' chars)'
    ELSE 'Invalid snapshot'
  END as snapshot_status,
  detected_at
FROM violations
ORDER BY detected_at DESC
LIMIT 10;
```

**What to look for**:
- `extreme_head_angle` violations should show "Has snapshot"
- `audio_speech` violations should show "Has snapshot"
- `tab_switch` violations should show "No snapshot"

## Step 3: Check for Failed Inserts

```sql
-- Check if any violations failed to insert
SELECT COUNT(*) as total_violations
FROM violations;

-- Compare with proctoring engine count
-- If proctoring engine shows "Violation 5/5" but database only has 3 rows,
-- then 2 violations failed to save
```

## Step 4: Test Snapshot Capture Manually

In browser console during exam:

```javascript
// Check if video element has valid stream
console.log('Video element:', videoRef.current);
console.log('Video width:', videoRef.current?.videoWidth);
console.log('Video height:', videoRef.current?.videoHeight);

// Check if canvas exists
console.log('Canvas element:', canvasRef.current);

// Try manual snapshot
const canvas = canvasRef.current;
const video = videoRef.current;
if (canvas && video) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  const base64 = canvas.toDataURL('image/jpeg', 0.6);
  console.log('Manual snapshot size:', Math.round(base64.length / 1024), 'KB');
  console.log('Snapshot preview:', base64.substring(0, 100) + '...');
}
```

## Step 5: Check RLS Policies

The 400 error might be from RLS blocking the insert. Check:

```sql
-- Check RLS policies on violations table
SELECT * FROM pg_policies WHERE tablename = 'violations';

-- Temporarily disable RLS for testing
ALTER TABLE violations DISABLE ROW LEVEL SECURITY;

-- Test exam with violations
-- Then re-enable:
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
```

## Step 6: Check Supabase Logs

1. Go to Supabase Dashboard
2. Click "Logs" → "Postgres Logs"
3. Look for errors around the time you triggered violations
4. Look for:
   - "violates check constraint"
   - "invalid input value for enum"
   - "permission denied"

## Common Issues & Solutions

### Issue 1: Enum Type Not Updated

**Symptom**: 400 error, "invalid input value for enum violation_type"

**Solution**:
```sql
ALTER TYPE violation_type ADD VALUE 'extreme_head_angle';
ALTER TYPE violation_type ADD VALUE 'multiple_faces';
```

### Issue 2: RLS Policy Blocking

**Symptom**: 400 error, no specific message

**Solution**:
```sql
-- Add policy to allow system inserts
DROP POLICY IF EXISTS "System can insert violations" ON violations;
CREATE POLICY "System can insert violations" ON violations 
FOR INSERT 
WITH CHECK (true);
```

### Issue 3: Snapshot Too Large

**Symptom**: 400 error, "value too long"

**Solution**: Reduce JPEG quality in `proctoringEngine.ts`:
```typescript
// Change from 0.6 to 0.4
const base64Image = this.canvasElement.toDataURL('image/jpeg', 0.4);
```

### Issue 4: Metadata JSON Invalid

**Symptom**: 400 error when saving audio violations

**Solution**: Check metadata format:
```sql
-- Check metadata column type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'violations' 
AND column_name = 'metadata';

-- Should be: jsonb
```

## Quick Fix

If snapshots still aren't saving, try this temporary workaround:

1. **Disable snapshot capture** for testing:
```typescript
// In proctoringEngine.ts, change:
if (requiresSnapshot) {
  console.log('Snapshot capture disabled for testing');
  snapshot = undefined; // Don't capture
}
```

2. **Test if violations save** without snapshots
3. **If they save**, the issue is with snapshot data
4. **If they still fail**, the issue is with violation type enum

## Verify Snapshots Are Saving

After triggering violations, run:

```sql
SELECT 
  violation_type,
  description,
  LENGTH(snapshot_url) as snapshot_size_chars,
  SUBSTRING(snapshot_url, 1, 50) as snapshot_preview,
  detected_at
FROM violations
WHERE snapshot_url IS NOT NULL
ORDER BY detected_at DESC
LIMIT 5;
```

**Expected output**:
- `extreme_head_angle` with snapshot_size_chars ~25000-30000
- `audio_speech` with snapshot_size_chars ~25000-30000
- Snapshot preview starts with: `data:image/jpeg;base64,/9j/4AAQ...`

## Next Steps

1. Run `supabase/fix_violation_types.sql` in SQL Editor
2. Check Supabase Postgres logs for specific error
3. Try exam again and check if violations save
4. Run the verification query above
5. Report back with results

The snapshots ARE being captured (logs prove it), they're just failing to save to database. The fix is likely just adding the missing enum values!
