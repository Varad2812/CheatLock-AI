# CheatLock AI - Complete Setup Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## System Requirements

### Development Environment
- Node.js 18.x or higher
- npm 9.x or higher
- Modern web browser (Chrome, Firefox, Edge)
- Webcam and microphone
- HTTPS enabled (required for camera/mic access)

### Supabase Requirements
- Supabase account (free tier works)
- PostgreSQL database
- Storage bucket
- Edge functions support

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd cheatlock-ai

# Install client dependencies
cd client
npm install
```

### 2. Supabase Setup

```bash
# Create a Supabase project at supabase.com
# Copy your project URL and anon key

# Create .env.local
cp .env.example .env.local

# Edit .env.local with your credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Open Supabase SQL Editor
2. Copy entire contents of `supabase/schema.sql`
3. Execute the script
4. Verify tables are created

### 4. Storage Setup

1. Go to Storage in Supabase dashboard
2. Create bucket: `violation-snapshots`
3. Set to public access
4. Configure CORS if needed

### 5. Run Development Server

```bash
cd client
npm run dev
```

Visit `http://localhost:3000`

## Detailed Setup

### Database Schema Explanation

#### Core Tables
- **users**: Extended user profiles with roles
- **exams**: Exam definitions and settings
- **questions**: Exam questions and answers
- **exam_attempts**: Student exam sessions
- **violations**: Detected cheating attempts
- **proctoring_logs**: Continuous monitoring data
- **reports**: Generated exam reports

#### Security Features
- Row Level Security (RLS) on all tables
- Role-based access control
- Automatic timestamp updates
- Foreign key constraints

### Proctoring System Components

#### 1. Gaze Detection (gazeDetector.ts)
- Uses MediaPipe Face Mesh
- Tracks 468 facial landmarks
- Detects gaze direction (left, right, up, down, center)
- Calculates head angle
- Allows downward gaze for rough sheets

**Configuration:**
```typescript
// Adjust thresholds in gazeDetector.ts
const SUSPICIOUS_DURATION = 2000; // 2 seconds
const FACE_MISSING_TIMEOUT = 5000; // 5 seconds
```

#### 2. Audio Detection (audioDetector.ts)
- Web Audio API for microphone access
- Real-time noise level analysis
- Speech pattern detection
- Distinguishes between cough and conversation

**Configuration:**
```typescript
// Adjust thresholds in audioDetector.ts
const SPEECH_DURATION_THRESHOLD = 3000; // 3 seconds
const HIGH_NOISE_THRESHOLD = 0.3;
```

#### 3. System Monitoring (systemMonitor.ts)
- Tab visibility tracking
- Window focus detection
- Mouse position monitoring
- Keyboard shortcut prevention

**Blocked Actions:**
- Copy/Paste (Ctrl+C, Ctrl+V)
- Cut (Ctrl+X)
- Select All (Ctrl+A)
- Find (Ctrl+F)
- Print (Ctrl+P)
- DevTools (F12, Ctrl+Shift+I)
- Right-click context menu

#### 4. Keystroke Analysis (keystrokeMonitor.ts)
- Typing rhythm analysis
- Paste attempt detection
- Unusual pause detection

### WebRTC Live Streaming

#### Student Side
```typescript
const streamer = new WebRTCStreamer(attemptId);
await streamer.startBroadcast(videoElement);
```

#### Examiner Side
```typescript
const streamer = new WebRTCStreamer(attemptId);
await streamer.connectToStream(videoElement, (stream) => {
  // Handle stream
});
```

**Signaling:** Uses Supabase Realtime for WebRTC signaling

## Configuration

### System Settings (Admin Panel)

#### Violation Threshold
- Default: 3 violations
- Range: 1-10
- Effect: Number of violations before auto-end

#### Gaze Sensitivity
- Default: 0.7 (70%)
- Range: 0.0-1.0
- Effect: How strict gaze detection is

#### Audio Sensitivity
- Default: 0.6 (60%)
- Range: 0.0-1.0
- Effect: How sensitive audio detection is

#### Face Missing Timeout
- Default: 5 seconds
- Range: 1-30 seconds
- Effect: Time before face missing triggers violation

### Exam-Level Settings

#### Proctoring Strictness
- Per-exam setting
- Range: 0.0-1.0
- Multiplies violation severity
- Allows flexible enforcement

## Testing

### 1. Create Test Users

```sql
-- Create admin
INSERT INTO auth.users (email, encrypted_password)
VALUES ('admin@test.com', crypt('password123', gen_salt('bf')));

INSERT INTO users (id, email, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@test.com'),
  'admin@test.com',
  'Admin User',
  'admin'
);

-- Repeat for teacher, examiner, student
```

### 2. Test Proctoring Features

#### Gaze Detection
1. Start exam
2. Look left/right - should trigger violation after 2 seconds
3. Look down - should be allowed (rough sheet)
4. Look up - should trigger violation
5. Turn face away - should trigger face missing

#### Audio Detection
1. Speak briefly - should be allowed
2. Have conversation - should trigger violation
3. Play audio - should trigger external audio violation

#### System Monitoring
1. Switch tabs - immediate violation
2. Click outside window - violation
3. Try to paste - violation
4. Try keyboard shortcuts - blocked

### 3. Test WebRTC Streaming

1. Student starts exam
2. Examiner opens monitoring dashboard
3. Click "View Live" on student
4. Verify video stream appears
5. Check for low latency

### 4. Test Violation System

1. Trigger 3 violations
2. Verify exam auto-ends
3. Check snapshots are captured
4. Verify violations logged in database

## Troubleshooting

### Camera/Microphone Issues

**Problem:** Camera not detected
**Solution:**
- Ensure HTTPS is enabled (required for getUserMedia)
- Check browser permissions
- Try different browser
- Verify camera is not in use by another app

**Problem:** MediaPipe not loading
**Solution:**
- Check internet connection (CDN required)
- Verify CDN URL in gazeDetector.ts
- Check browser console for errors

### WebRTC Issues

**Problem:** Live stream not connecting
**Solution:**
- Check Supabase Realtime is enabled
- Verify both users are subscribed to same channel
- Check firewall/network settings
- Try different network

**Problem:** High latency
**Solution:**
- Check network bandwidth
- Reduce video quality in WebRTC config
- Use TURN server for NAT traversal

### Database Issues

**Problem:** RLS policy errors
**Solution:**
- Verify user role is set correctly
- Check RLS policies in Supabase
- Ensure user is authenticated

**Problem:** Slow queries
**Solution:**
- Check indexes are created
- Review query patterns
- Enable connection pooling

### Deployment Issues

**Problem:** Environment variables not working
**Solution:**
- Verify .env.local exists
- Restart development server
- Check variable names match exactly

**Problem:** Build fails
**Solution:**
- Clear .next directory
- Delete node_modules and reinstall
- Check for TypeScript errors

## Best Practices

### For Administrators
1. Set appropriate violation thresholds
2. Adjust sensitivity based on exam type
3. Monitor system performance
4. Review violation patterns
5. Backup database regularly

### For Teachers
1. Test exam before activating
2. Set appropriate duration
3. Adjust proctoring strictness
4. Review reports after exam
5. Provide clear instructions to students

### For Students
1. Test camera/mic before exam
2. Ensure stable internet connection
3. Close unnecessary applications
4. Use supported browser
5. Have rough sheet ready if needed

## Advanced Configuration

### Custom Violation Rules

Edit violation detectors to customize behavior:

```typescript
// In gazeViolationDetector.ts
if (gazeData.direction === 'down' && gazeData.headAngle < 50) {
  return { isViolation: false }; // Customize angle threshold
}
```

### Custom Proctoring Intervals

```typescript
// In proctoringEngine.ts
this.logInterval = setInterval(async () => {
  // Log every 5 seconds (adjust as needed)
}, 5000);
```

### Storage Optimization

```typescript
// Adjust snapshot quality
this.canvasElement!.toBlob(resolve, 'image/jpeg', 0.8); // 0.8 = 80% quality
```

## Support and Resources

- **Documentation:** `/docs` directory
- **API Reference:** `docs/API_DOCUMENTATION.md`
- **Deployment Guide:** `docs/DEPLOYMENT.md`
- **Supabase Docs:** https://supabase.com/docs
- **MediaPipe Docs:** https://google.github.io/mediapipe/

## Next Steps

1. Complete setup following this guide
2. Create test users and exams
3. Test all proctoring features
4. Review and adjust settings
5. Deploy to production
6. Monitor and optimize

For production deployment, see `docs/DEPLOYMENT.md`
