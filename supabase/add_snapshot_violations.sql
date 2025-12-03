-- Migration: Add new violation types for snapshot-based monitoring
-- Run this if you already have an existing database

-- Add new violation types to enum
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'multiple_faces';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'extreme_head_angle';

-- Ensure metadata column exists (should already be there from schema.sql)
-- This is just a safety check
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'violations' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE violations ADD COLUMN metadata JSONB;
    END IF;
END $$;

-- Create index on metadata for faster audio level queries
CREATE INDEX IF NOT EXISTS idx_violations_metadata ON violations USING GIN (metadata);

-- Update RLS policies to ensure teachers can view snapshots
-- (Should already be covered by existing policies, but adding for clarity)
DROP POLICY IF EXISTS "Teachers can view violation snapshots" ON violations;
CREATE POLICY "Teachers can view violation snapshots" ON violations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_attempts ea
    JOIN exams e ON ea.exam_id = e.id
    WHERE ea.id = violations.attempt_id 
    AND e.teacher_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- Add comment for documentation
COMMENT ON COLUMN violations.snapshot_url IS 'Base64 encoded JPEG image captured during violation (only for critical violations)';
COMMENT ON COLUMN violations.metadata IS 'Additional violation data: { audioLevel: 0.0-1.0 }';

-- Verify the changes
SELECT 
    'Violation types updated' as status,
    COUNT(*) as total_violation_types
FROM pg_enum
WHERE enumtypid = 'violation_type'::regtype;

SELECT 
    'Metadata column exists' as status,
    data_type
FROM information_schema.columns
WHERE table_name = 'violations' AND column_name = 'metadata';
