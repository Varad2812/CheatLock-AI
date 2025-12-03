# CheatLock AI - Complete Project Structure

## Overview
CheatLock AI is a comprehensive anti-cheating examination system with multi-layer AI-powered monitoring.

## Directory Structure

```
cheatlock-ai/
├── client/                          # Next.js frontend application
│   ├── app/                         # Next.js 14 app directory
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   ├── auth/                    # Authentication pages
│   │   │   └── login/
│   │   │       └── page.tsx         # Login page
│   │   ├── admin/                   # Admin dashboard
│   │   │   └── dashboard/
│   │   │       └── page.tsx         # Admin dashboard
│   │   ├── teacher/                 # Teacher pages
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # Teacher dashboard
│   │   │   ├── create-exam/
│   │   │   │   └── page.tsx         # Create exam form
│   │   │   └── exam/
│   │   │       └── [id]/
│   │   │           ├── questions/   # Manage questions
│   │   │           └── reports/     # View reports
│   │   ├── examiner/                # Examiner pages
│   │   │   └── monitor/
│   │   │       └── [examId]/
│   │   │           └── page.tsx     # Live monitoring dashboard
│   │   └── student/                 # Student pages
│   │       ├── dashboard/
│   │       │   └── page.tsx         # Student dashboard
│   │       └── exam/
│   │           └── [id]/
│   │               └── page.tsx     # Take exam (proctored)
│   │
│   ├── proctoring/                  # Proctoring engine modules
│   │   ├── gazeDetector.ts          # AI gaze & head tracking
│   │   ├── audioDetector.ts         # Voice/mic monitoring
│   │   ├── systemMonitor.ts         # System focus tracking
│   │   ├── keystrokeMonitor.ts      # Keystroke analysis
│   │   └── proctoringEngine.ts      # Main proctoring orchestrator
│   │
│   ├── utils/                       # Utility functions
│   │   ├── supabase.ts              # Supabase client & types
│   │   ├── webrtc.ts                # WebRTC streaming
│   │   └── reportGenerator.ts       # PDF report generation
│   │
│   ├── components/                  # Reusable React components
│   │   └── (to be added as needed)
│   │
│   ├── hooks/                       # Custom React hooks
│   │   └── (to be added as needed)
│   │
│   ├── package.json                 # Dependencies
│   ├── tsconfig.json                # TypeScript config
│   ├── next.config.js               # Next.js config
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── postcss.config.js            # PostCSS config
│   └── .env.example                 # Environment variables template
│
├── supabase/                        # Supabase backend
│   ├── schema.sql                   # Complete database schema
│   └── functions/                   # Edge functions
│       ├── violation-engine/
│       │   └── index.ts             # Violation processing
│       └── report-generator/
│           └── index.ts             # Report generation
│
├── docs/                            # Documentation
│   ├── SETUP_GUIDE.md               # Complete setup instructions
│   ├── API_DOCUMENTATION.md         # API reference
│   └── DEPLOYMENT.md                # Deployment guide
│
├── README.md                        # Project overview
├── INSTALLATION.md                  # Quick installation guide
├── PROJECT_STRUCTURE.md             # This file
└── .gitignore                       # Git ignore rules
```

## Key Components

### 1. Proctoring System

#### gazeDetector.ts
- **Purpose:** AI-powered gaze and head tracking
- **Technology:** MediaPipe Face Mesh
- **Features:**
  - 468 facial landmark detection
  - Gaze direction calculation (left, right, up, down, center)
  - Head angle measurement
  - Face presence detection
  - Rough-sheet safe mode (downward gaze allowed)

#### audioDetector.ts
- **Purpose:** Voice and microphone monitoring
- **Technology:** Web Audio API
- **Features:**
  - Real-time noise level analysis
  - Speech pattern detection
  - External voice detection
  - Background noise filtering

#### systemMonitor.ts
- **Purpose:** System behavior tracking
- **Features:**
  - Tab visibility monitoring
  - Window focus detection
  - Mouse position tracking
  - Keyboard shortcut prevention
  - Copy/paste blocking

#### keystrokeMonitor.ts
- **Purpose:** Typing behavior analysis
- **Features:**
  - Keystroke rhythm tracking
  - Paste attempt detection
  - Unusual pause detection
  - Typing pattern analysis

#### proctoringEngine.ts
- **Purpose:** Main orchestrator
- **Features:**
  - Coordinates all detectors
  - Violation aggregation
  - Snapshot capture
  - Auto-exam termination
  - Real-time logging

### 2. WebRTC Streaming

#### webrtc.ts
- **Purpose:** Live camera feed for examiners
- **Technology:** SimplePeer + Supabase Realtime
- **Features:**
  - Student-to-examiner video streaming
  - Low-latency peer-to-peer connection
  - Supabase Realtime signaling
  - Multiple concurrent streams

### 3. Database Schema

#### Core Tables
1. **users** - User profiles with roles
2. **exams** - Exam definitions
3. **questions** - Exam questions
4. **exam_attempts** - Student exam sessions
5. **violations** - Detected violations
6. **proctoring_logs** - Continuous monitoring data
7. **reports** - Generated reports
8. **system_settings** - Global configuration
9. **exam_assignments** - Examiner assignments

#### Security
- Row Level Security (RLS) on all tables
- Role-based access control
- Automatic triggers for timestamps
- Foreign key constraints

### 4. User Roles

#### Admin
- Manage all users
- Configure system settings
- View all exams and reports
- Adjust violation thresholds
- Set AI sensitivity levels

#### Teacher
- Create and manage exams
- Upload questions
- Assign examiners
- View student reports
- Adjust proctoring strictness per exam

#### Examiner
- Monitor students in real-time
- Access live camera feeds
- View violation counts
- Force end exams
- Review proctoring logs

#### Student
- Take exams
- View available exams
- See past attempts
- Access scores and feedback

## Violation System

### Violation Types
1. **gaze_sideward** - Looking sideways (severity: 0.7)
2. **gaze_upward** - Looking upward (severity: 0.7)
3. **gaze_away** - Repeated off-screen glances (severity: 0.6)
4. **face_missing** - Face not detected (severity: 0.9)
5. **audio_speech** - Speech detected (severity: 0.8)
6. **audio_external** - External voices (severity: 0.9)
7. **tab_switch** - Tab switched (severity: 0.9)
8. **window_blur** - Window lost focus (severity: 0.8)
9. **copy_paste** - Paste attempt (severity: 0.9)
10. **keystroke_anomaly** - Unusual typing (severity: 0.5)
11. **multiple_devices** - Possible second screen (severity: 0.7)

### Violation Flow
1. Detector identifies suspicious behavior
2. Violation detector validates and scores
3. Snapshot captured from webcam
4. Violation saved to database
5. Attempt violation count updated
6. If threshold exceeded → auto-end exam
7. Real-time notification to examiner

### Cheating Risk Score
Calculated based on:
- Total violation count (weight: 0.15 each)
- Severity-weighted score (weight: 0.2 each)
- High-severity violations (weight: 0.25 each)
- Capped at 1.0 (100%)

## AI Behavior Rules

### Gaze Rules
- **Downward 20-50°:** Allowed (rough sheet)
- **Sideward/Upward > 2s:** Violation
- **Repeated off-screen:** Violation
- **Face missing > 5s:** Major violation

### Audio Rules
- **Single cough/noise:** Allowed
- **Detected speech:** Violation
- **Long-duration speaking:** Major violation
- **External voices:** Major violation

### Keystroke Rules
- **Copy/paste attempt:** Violation
- **Suspicious pauses:** Soft flag
- **Auto-complete:** Disabled
- **Spellcheck:** Disabled

### Focus Rules
- **Tab change:** Instant violation
- **Window unfocus:** Violation
- **Mouse leaving frequently:** Multiple device flag

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI:** TensorFlow.js, MediaPipe
- **WebRTC:** SimplePeer
- **PDF:** jsPDF
- **Charts:** Recharts
- **State:** Zustand
- **Notifications:** React Hot Toast

### Backend
- **Platform:** Supabase
- **Database:** PostgreSQL
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime
- **Functions:** Deno Edge Functions

### AI/ML
- **Face Detection:** MediaPipe Face Mesh
- **Audio Analysis:** Web Audio API
- **Pattern Recognition:** Custom algorithms

## Data Flow

### Exam Taking Flow
1. Student logs in
2. Selects exam
3. Camera/mic permission check
4. Face detection verification
5. Exam starts → Proctoring activates
6. Continuous monitoring:
   - Gaze tracking (real-time)
   - Audio monitoring (real-time)
   - System monitoring (real-time)
   - Keystroke analysis (real-time)
   - Logs sent every 5 seconds
7. Violations detected → Snapshots captured
8. Threshold exceeded → Auto-end
9. Exam submitted → Report generated

### Examiner Monitoring Flow
1. Examiner logs in
2. Selects exam to monitor
3. Views all active students
4. Real-time violation updates
5. Can open live camera feed (WebRTC)
6. Can force end exam
7. Reviews violations and snapshots

### Report Generation Flow
1. Exam completed/ended
2. Edge function triggered
3. Aggregates all data:
   - Violations
   - Proctoring logs
   - Snapshots
   - Answers
4. Calculates risk score
5. Generates timeline
6. Creates PDF report
7. Stores in database

## Security Features

### Authentication
- Supabase Auth with JWT
- Role-based access control
- Session management
- Secure password hashing

### Authorization
- Row Level Security (RLS)
- Role-based policies
- Resource-level permissions
- API key protection

### Data Protection
- HTTPS only
- Encrypted storage
- Secure WebRTC
- No PII in logs

### Exam Security
- Fullscreen mode
- Keyboard blocking
- Copy/paste prevention
- Right-click disabled
- DevTools blocked
- Tab switch detection

## Performance Considerations

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Efficient re-renders
- Debounced updates

### Backend
- Database indexes
- Connection pooling
- Query optimization
- Caching strategies
- Rate limiting

### AI Processing
- Client-side processing
- Efficient algorithms
- Throttled updates
- Optimized models

### WebRTC
- Peer-to-peer connection
- Adaptive bitrate
- Low-latency signaling
- Connection fallback

## Deployment

### Development
```bash
cd client
npm install
npm run dev
```

### Production
- Deploy frontend to Vercel/Netlify
- Deploy edge functions to Supabase
- Configure environment variables
- Setup custom domain
- Enable SSL
- Configure CORS

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_APP_URL=your_domain
```

### System Settings
- Violation threshold: 3 (default)
- Gaze sensitivity: 0.7 (default)
- Audio sensitivity: 0.6 (default)
- Face missing timeout: 5s (default)

### Exam Settings
- Duration: Configurable per exam
- Total marks: Configurable per exam
- Proctoring strictness: 0.0-1.0 per exam

## Testing

### Unit Tests
- Violation detectors
- Utility functions
- Report generation

### Integration Tests
- Proctoring engine
- WebRTC streaming
- Database operations

### E2E Tests
- Complete exam flow
- Violation detection
- Report generation

## Monitoring

### Metrics to Track
- Violation detection accuracy
- WebRTC connection success rate
- Exam completion rate
- System performance
- User satisfaction

### Logs to Review
- Violation logs
- Proctoring logs
- Error logs
- Performance logs

## Future Enhancements

### Planned Features
- Mobile app support
- Advanced AI models
- Behavioral biometrics
- Multi-language support
- Analytics dashboard
- Automated grading
- Question bank
- Exam scheduling

### Scalability
- Horizontal scaling
- Load balancing
- CDN integration
- Database sharding
- Caching layer

## Support

For detailed information:
- **Setup:** See `INSTALLATION.md`
- **API:** See `docs/API_DOCUMENTATION.md`
- **Deployment:** See `docs/DEPLOYMENT.md`
- **Troubleshooting:** See `docs/SETUP_GUIDE.md`
