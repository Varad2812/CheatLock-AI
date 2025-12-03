-- Add audio recording field to violations table
-- This stores base64 encoded audio snippets captured during audio violations

ALTER TABLE violations 
ADD COLUMN IF NOT EXISTS audio_recording TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER,
ADD COLUMN IF NOT EXISTS audio_level FLOAT;

-- Add comment for documentation
COMMENT ON COLUMN violations.audio_recording IS 'Base64 encoded audio snippet (3-5 seconds) captured during audio violation';
COMMENT ON COLUMN violations.audio_duration IS 'Duration of audio recording in milliseconds';
COMMENT ON COLUMN violations.audio_level IS 'Audio level (0.0-1.0) at time of violation';
