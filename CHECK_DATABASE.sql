-- ============================================
-- STEP 1: Check if audio columns exist
-- ============================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'violations'
ORDER BY column_name;

-- Expected columns:
-- audio_duration (integer)
-- audio_level (double precision)
-- audio_recording (text)
-- snapshot_url (text)

-- ============================================
-- STEP 2: If audio columns are missing, add them
-- ============================================
ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;

-- ============================================
-- STEP 3: Check recent violations
-- ============================================
SELECT 
  id,
  violation_type,
  severity,
  description,
  snapshot_url IS NOT NULL as has_snapshot,
  LENGTH(snapshot_url) as snapshot_size,
  audio_recording IS NOT NULL as has_audio,
  LENGTH(audio_recording) as audio_size,
  audio_duration,
  audio_level,
  detected_at
FROM violations
ORDER BY detected_at DESC
LIMIT 10;

-- What to look for:
-- has_snapshot should be TRUE
-- snapshot_size should be 40000-80000 (40-80 KB)
-- has_audio should be TRUE for audio violations
-- audio_size should be 40000-60000 (40-60 KB)

-- ============================================
-- STEP 4: Check if violations exist at all
-- ============================================
SELECT 
  COUNT(*) as total_violations,
  COUNT(CASE WHEN snapshot_url IS NOT NULL THEN 1 END) as with_snapshots,
  COUNT(CASE WHEN audio_recording IS NOT NULL THEN 1 END) as with_audio
FROM violations;

-- ============================================
-- STEP 5: Check exam attempts
-- ============================================
SELECT 
  id,
  student_id,
  exam_id,
  status,
  violation_count,
  started_at,
  submitted_at
FROM exam_attempts
ORDER BY started_at DESC
LIMIT 5;

-- ============================================
-- STEP 6: Get violations for latest attempt
-- ============================================
SELECT 
  v.violation_type,
  v.severity,
  v.description,
  v.snapshot_url IS NOT NULL as has_snapshot,
  v.audio_recording IS NOT NULL as has_audio,
  v.detected_at
FROM violations v
JOIN exam_attempts ea ON v.attempt_id = ea.id
WHERE ea.id = (SELECT id FROM exam_attempts ORDER BY started_at DESC LIMIT 1)
ORDER BY v.detected_at;
