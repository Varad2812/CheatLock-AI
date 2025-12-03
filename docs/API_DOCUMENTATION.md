# CheatLock AI - API Documentation

## Overview
CheatLock AI uses Supabase for backend services including authentication, database, storage, and edge functions.

## Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign Out
```typescript
await supabase.auth.signOut();
```

## Database Tables

### users
- `id` (UUID, PK) - User ID from auth.users
- `email` (TEXT) - User email
- `full_name` (TEXT) - Full name
- `role` (ENUM) - admin | teacher | examiner | student
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### exams
- `id` (UUID, PK)
- `title` (TEXT) - Exam title
- `description` (TEXT) - Exam description
- `teacher_id` (UUID, FK) - Creator teacher
- `duration_minutes` (INTEGER) - Exam duration
- `total_marks` (INTEGER) - Total marks
- `proctoring_strictness` (FLOAT) - 0.0 to 1.0
- `start_time` (TIMESTAMPTZ)
- `end_time` (TIMESTAMPTZ)
- `is_active` (BOOLEAN)

### questions
- `id` (UUID, PK)
- `exam_id` (UUID, FK)
- `question_text` (TEXT)
- `question_type` (TEXT) - multiple_choice | text
- `options` (JSONB) - Array of options
- `correct_answer` (TEXT)
- `marks` (INTEGER)
- `order_index` (INTEGER)

### exam_attempts
- `id` (UUID, PK)
- `exam_id` (UUID, FK)
- `student_id` (UUID, FK)
- `started_at` (TIMESTAMPTZ)
- `submitted_at` (TIMESTAMPTZ)
- `auto_ended` (BOOLEAN)
- `violation_count` (INTEGER)
- `final_score` (INTEGER)
- `cheating_risk_score` (FLOAT)
- `answers` (JSONB)
- `status` (TEXT) - in_progress | completed | ended

### violations
- `id` (UUID, PK)
- `attempt_id` (UUID, FK)
- `violation_type` (ENUM) - See violation types below
- `severity` (FLOAT) - 0.0 to 1.0
- `description` (TEXT)
- `snapshot_url` (TEXT)
- `metadata` (JSONB)
- `detected_at` (TIMESTAMPTZ)

### Violation Types
- `gaze_sideward` - Looking sideways
- `gaze_upward` - Looking upward
- `gaze_away` - Looking away from screen
- `face_missing` - Face not detected
- `audio_speech` - Speech detected
- `audio_external` - External voices
- `tab_switch` - Tab switched
- `window_blur` - Window lost focus
- `copy_paste` - Paste attempt
- `keystroke_anomaly` - Unusual typing pattern
- `multiple_devices` - Possible second screen

## Edge Functions

### violation-engine
Records and processes violations.

**Endpoint:** `/functions/v1/violation-engine`

**Request:**
```json
{
  "attemptId": "uuid",
  "violationType": "gaze_sideward",
  "severity": 0.7,
  "description": "Sustained sideward gaze detected",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "action": "violation_recorded",
  "violationCount": 2
}
```

### report-generator
Generates comprehensive exam reports.

**Endpoint:** `/functions/v1/report-generator`

**Request:**
```json
{
  "attemptId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "attempt": {},
    "student": {},
    "exam": {},
    "violations": [],
    "statistics": {},
    "timeline": []
  }
}
```

## Realtime Subscriptions

### Monitor Violations
```typescript
const channel = supabase
  .channel('exam:exam-id')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'violations'
  }, (payload) => {
    console.log('New violation:', payload.new);
  })
  .subscribe();
```

### Monitor Exam Attempts
```typescript
const channel = supabase
  .channel('exam:exam-id')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'exam_attempts'
  }, (payload) => {
    console.log('Attempt updated:', payload.new);
  })
  .subscribe();
```

## WebRTC Signaling

### Student Broadcasting
```typescript
const streamer = new WebRTCStreamer(attemptId);
await streamer.startBroadcast(videoElement);
```

### Examiner Viewing
```typescript
const streamer = new WebRTCStreamer(attemptId);
await streamer.connectToStream(videoElement, (stream) => {
  console.log('Connected to student stream');
});
```

## Storage

### Upload Violation Snapshot
```typescript
const { data, error } = await supabase.storage
  .from('violation-snapshots')
  .upload(fileName, blob);
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('violation-snapshots')
  .getPublicUrl(fileName);
```

## Row Level Security (RLS)

All tables have RLS enabled with policies based on user roles:
- **Admin**: Full access to all data
- **Teacher**: Access to their own exams and related data
- **Examiner**: Read access to exam attempts and violations
- **Student**: Access to their own attempts and available exams

## Rate Limiting

Proctoring logs are sent every 5 seconds to avoid overwhelming the database.
Violation checks are performed in real-time but debounced to prevent duplicate entries.
