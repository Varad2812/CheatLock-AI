# Audio Recording Feature - Demo Guide

## Visual Walkthrough

### 1. Student Exam Experience

```
┌─────────────────────────────────────────────────────────┐
│  📹 Camera Active    🎤 Microphone Active               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Question 1: What is 2 + 2?                            │
│  ○ 3                                                    │
│  ○ 4                                                    │
│  ○ 5                                                    │
│                                                         │
│  Violations: 0/3                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘

Student speaks: "Hey, what's the answer?"
                      ↓
┌─────────────────────────────────────────────────────────┐
│  ⚠️ WARNING: Audio violation detected                   │
│  Please maintain silence during the exam                │
│                                                         │
│  Violations: 1/3                                        │
└─────────────────────────────────────────────────────────┘

Behind the scenes:
✅ Audio violation detected
✅ 3-second audio snippet recorded
✅ Camera snapshot captured
✅ Evidence saved to database
```

### 2. Teacher Reports View

```
┌─────────────────────────────────────────────────────────────────┐
│  Exam Reports - Introduction to Programming                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Student          Status      Score  Violations  Actions       │
│  ─────────────────────────────────────────────────────────────  │
│  John Doe         Completed   85/100    1        [Report] [Evidence] │
│  Jane Smith       Auto-ended  0/100     3        [Report] [Evidence] │
│  Bob Wilson       Completed   92/100    0        [Report]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Click "Evidence" button →
```

### 3. Evidence Modal

```
┌───────────────────────────────────────────────────────────────────┐
│  Violation Evidence - Jane Smith                          [Close] │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │ 1. AUDIO_SPEECH         │  │ 2. GAZE_AWAY            │       │
│  │ 2:34 PM                 │  │ 2:35 PM                 │       │
│  │ Speech detected         │  │ Looking away from screen│       │
│  │                         │  │                         │       │
│  │ [Camera Snapshot]       │  │ [Camera Snapshot]       │       │
│  │ 📷 Student speaking     │  │ 📷 Student looking left │       │
│  │                         │  │                         │       │
│  │ 🔊 Audio Recording      │  │                         │       │
│  │ ▶️ ━━━━━━━━━━━━ 3.0s   │  │                         │       │
│  │ Peak Level: 78%         │  │                         │       │
│  └─────────────────────────┘  └─────────────────────────┘       │
│                                                                   │
│  ┌─────────────────────────┐                                     │
│  │ 3. AUDIO_EXTERNAL       │                                     │
│  │ 2:38 PM                 │                                     │
│  │ Excessive noise         │                                     │
│  │                         │                                     │
│  │ [Camera Snapshot]       │                                     │
│  │ 📷 Student at desk      │                                     │
│  │                         │                                     │
│  │ 🔊 Audio Recording      │                                     │
│  │ ▶️ ━━━━━━━━━━━━ 3.0s   │                                     │
│  │ Peak Level: 65%         │                                     │
│  └─────────────────────────┘                                     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Console Output Examples

### During Exam (Student Side)

```javascript
// Exam starts
✅ Proctoring engine started successfully
✅ AudioRecorder initialized successfully
📊 Audio monitoring: noiseLevel: 5.2%, speechDetected: false

// Student speaks
⚠️ Audio violation detected - starting audio recording
🎙️ Started audio recording for 3000ms
📸 Capturing snapshot for violation: audio_speech
✅ Audio recording completed: duration: 3000ms, size: 42.5 KB
💾 Saving violation to database
✅ Violation saved to database
📈 Violation count updated in database: 1

// Violation logged
🚨 Violation 1/3: {
  type: 'audio_speech',
  severity: 0.8,
  description: 'Speech or talking detected - maintain silence',
  audioLevel: 0.78
}
```

### In Reports (Teacher Side)

```javascript
// Loading reports
📊 Loading exam reports...
✅ Loaded 3 attempts with violations

// Viewing evidence
👁️ Opening evidence modal for Jane Smith
📸 Found 2 snapshots
🎙️ Found 2 audio recordings
✅ Evidence loaded successfully
```

## Audio Playback UI

```
┌─────────────────────────────────────────────────┐
│ 🔊 Audio Recording (3.0s)                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  ▶️  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  🔊       │
│  0:00                              3.0s         │
│                                                 │
│  Peak Level: 78%                                │
│                                                 │
└─────────────────────────────────────────────────┘

Controls:
▶️  Play/Pause
━━━ Seek bar (click to jump)
🔊  Volume control
```

## Real-World Scenarios

### Scenario 1: Student Asks for Help
```
Student: "Hey, can you help me with question 5?"
         ↓
System:  🎙️ Records 3 seconds
         📸 Captures snapshot
         💾 Saves as audio_speech violation
         ↓
Teacher: 🎧 Plays recording
         👂 Hears: "Hey, can you help me with question 5?"
         ✅ Confirms violation
```

### Scenario 2: Phone Rings
```
Phone:   📱 *Ring ring ring*
         ↓
System:  🎙️ Records 3 seconds
         📸 Captures snapshot
         💾 Saves as audio_external violation
         ↓
Teacher: 🎧 Plays recording
         👂 Hears: Phone ringing
         ⚠️ Decides if intentional
```

### Scenario 3: Background Noise
```
Background: 🚗 Traffic noise, 🐕 dog barking
            ↓
System:     📊 Monitors audio level
            ⚖️ Below threshold (15%)
            ✅ No violation triggered
            ↓
Student:    😊 Continues exam normally
```

## Database Structure

```sql
violations table:
┌──────────────┬─────────────────┬──────────────────────────┐
│ Column       │ Type            │ Example                  │
├──────────────┼─────────────────┼──────────────────────────┤
│ id           │ UUID            │ 123e4567-e89b-12d3-...   │
│ attempt_id   │ UUID            │ 987f6543-c21a-43e2-...   │
│ violation_   │ violation_type  │ audio_speech             │
│   type       │                 │                          │
│ severity     │ FLOAT           │ 0.8                      │
│ description  │ TEXT            │ Speech detected          │
│ snapshot_url │ TEXT            │ data:image/jpeg;base64...│
│ audio_       │ TEXT            │ SGVsbG8gV29ybGQ=...      │
│   recording  │                 │ (base64 audio)           │
│ audio_       │ INTEGER         │ 3000                     │
│   duration   │                 │ (milliseconds)           │
│ audio_level  │ FLOAT           │ 0.78                     │
│              │                 │ (0.0 - 1.0)              │
│ detected_at  │ TIMESTAMPTZ     │ 2024-12-04 14:35:22      │
└──────────────┴─────────────────┴──────────────────────────┘
```

## Testing Steps

### 1. Setup Test
```bash
# Apply database migration
supabase db push supabase/add_audio_recordings.sql

# Start development server
cd client && npm run dev
```

### 2. Create Test Exam
```
1. Login as teacher
2. Create exam with 3 questions
3. Set violation threshold to 3
4. Activate exam
```

### 3. Take Exam as Student
```
1. Login as student
2. Start exam
3. Grant camera + microphone permissions
4. Speak clearly: "Testing audio recording"
5. Wait for violation notification
6. Check console for recording confirmation
```

### 4. Verify as Teacher
```
1. Go to exam reports
2. Find student attempt
3. Click "Evidence" button
4. Verify audio player appears
5. Click play button
6. Hear recorded audio
```

## Success Indicators

✅ Microphone permission granted
✅ "AudioRecorder initialized" in console
✅ Audio violation detected on speech
✅ "Audio recording completed" message
✅ Violation saved with audio_recording field
✅ Audio player appears in reports
✅ Audio plays when clicked
✅ Audio level displayed correctly

## Troubleshooting

### No Recording
```
❌ Check: Microphone permission
❌ Check: Browser supports MediaRecorder
❌ Check: Audio sensitivity > 0
❌ Check: Console for errors
```

### No Playback
```
❌ Check: Audio data in database
❌ Check: Browser audio codec support
❌ Check: Base64 encoding valid
❌ Check: Audio element controls
```

## Summary

The audio recording feature provides:
- 🎙️ Automatic recording on violations
- 📸 Synchronized with snapshots
- 💾 Efficient base64 storage
- 🎧 Easy playback for teachers
- ⚖️ Fair evidence for grading

**Result**: Teachers can now hear exactly what happened during audio violations!
