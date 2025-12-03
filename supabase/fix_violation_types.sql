-- Fix: Add missing violation types to existing database
-- Run this in Supabase SQL Editor

-- Check current violation types
SELECT enumlabel as violation_type 
FROM pg_enum 
WHERE enumtypid = 'violation_type'::regtype
ORDER BY enumlabel;

-- Add missing types (will skip if already exists)
DO $$ 
BEGIN
    -- Add multiple_faces if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'multiple_faces' 
        AND enumtypid = 'violation_type'::regtype
    ) THEN
        ALTER TYPE violation_type ADD VALUE 'multiple_faces';
        RAISE NOTICE 'Added multiple_faces';
    END IF;

    -- Add extreme_head_angle if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'extreme_head_angle' 
        AND enumtypid = 'violation_type'::regtype
    ) THEN
        ALTER TYPE violation_type ADD VALUE 'extreme_head_angle';
        RAISE NOTICE 'Added extreme_head_angle';
    END IF;
END $$;

-- Verify all types exist
SELECT enumlabel as violation_type 
FROM pg_enum 
WHERE enumtypid = 'violation_type'::regtype
ORDER BY enumlabel;

-- Expected output should include:
-- audio_external
-- audio_speech
-- copy_paste
-- extreme_head_angle  ← NEW
-- face_missing
-- gaze_away
-- gaze_sideward
-- gaze_upward
-- keystroke_anomaly
-- multiple_devices
-- multiple_faces  ← NEW
-- tab_switch
-- window_blur
