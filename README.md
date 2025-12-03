# 🔐 CheatLock AI - Comprehensive AI-Powered Secure Examination System

<div align="center">

![CheatLock AI](https://img.shields.io/badge/CheatLock-AI-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**A production-ready, multi-layer anti-cheating examination platform with AI-powered monitoring**

[Quick Start](#-quick-start) • [Features](#-key-features) • [Documentation](#-documentation) • [Demo](#-demo)

</div>

---

## 🎯 Overview

CheatLock AI is a comprehensive examination platform that uses artificial intelligence and real-time monitoring to prevent cheating during online exams. It combines multiple detection layers to ensure exam integrity while maintaining a smooth user experience.

### 🚀 What Makes It Special?

- **🤖 AI-Powered**: Uses MediaPipe Face Mesh for precise gaze tracking
- **🎥 Live Monitoring**: Real-time WebRTC streaming for examiners
- **📊 Comprehensive Reports**: Detailed violation logs with evidence
- **🔒 Multi-Layer Security**: 11 different violation types detected
- **⚡ Real-Time**: Instant violation detection and notifications
- **📱 Production Ready**: Complete with authentication, authorization, and deployment guides

## 🎨 Key Features

### Multi-Layer Anti-Cheating System

| Feature | Description | Status |
|---------|-------------|--------|
| **AI Gaze Tracking** | 468-point facial landmark detection, tracks eye movement and head orientation | ✅ |
| **Voice Monitoring** | Real-time audio analysis, detects speech and external voices | ✅ |
| **Audio Recording** | 🎙️ **NEW!** Captures 3-second audio snippets during violations for evidence | ✅ |
| **System Tracking** | Tab switches, window blur, mouse position monitoring | ✅ |
| **Keystroke Analysis** | Typing patterns, paste detection, unusual pauses | ✅ |
| **Auto-Violation** | Automatic exam termination after threshold (default: 3) | ✅ |
| **Live Streaming** | WebRTC camera feed for examiners | ✅ |
| **Snapshot Capture** | Webcam photos at each violation moment | ✅ |
| **PDF Reports** | Comprehensive post-exam reports with risk scores | ✅ |

### User Roles & Permissions

- **👨‍💼 Admin**: System configuration, user management, global settings
- **👨‍🏫 Teacher**: Exam creation, question management, report viewing
- **👨‍⚖️ Examiner**: Live monitoring, camera access, force exam termination
- **👨‍🎓 Student**: Take exams with full proctoring enabled

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI/ML**: TensorFlow.js, MediaPipe Face Mesh
- **Video**: WebRTC (SimplePeer)
- **State**: Zustand
- **UI**: Lucide React Icons, React Hot Toast

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL with Row Level Security
- **Auth**: Supabase Auth (JWT)
- **Storage**: Supabase Storage (snapshots)
- **Realtime**: Supabase Realtime (WebSocket)
- **Functions**: Deno Edge Functions

### AI & Detection
- **Face Detection**: MediaPipe Face Mesh (468 landmarks)
- **Audio Analysis**: Web Audio API
- **Pattern Recognition**: Custom algorithms

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- Modern browser with camera/mic

### Installation (5 minutes)

```bash
# 1. Clone and setup
git clone <repository-url>
cd cheatlock-ai
chmod +x setup.sh
./setup.sh

# 2. Configure Supabase
# - Create project at supabase.com
# - Copy URL and anon key to client/.env.local

# 3. Setup database
# - Open Supabase SQL Editor
# - Copy/paste supabase/schema.sql
# - Execute

# 4. Create storage bucket
# - Name: violation-snapshots
# - Make public

# 5. Run application
cd client
npm run dev
```

Visit: http://localhost:3000

### Create First Admin

```sql
-- In Supabase SQL Editor
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [QUICK_START.md](QUICK_START.md) | 5-minute setup guide |
| [INSTALLATION.md](INSTALLATION.md) | Detailed installation instructions |
| [FEATURES.md](FEATURES.md) | Complete feature list |
| [AUDIO_RECORDING_FEATURE.md](AUDIO_RECORDING_FEATURE.md) | 🎙️ **NEW!** Audio recording documentation |
| [AUDIO_RECORDING_SETUP.md](AUDIO_RECORDING_SETUP.md) | Audio recording setup guide |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Code organization and architecture |
| [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) | Comprehensive setup guide |
| [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | API reference |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment guide |

## 🎯 How It Works

### Exam Flow

```
Student Login → Camera/Mic Check → Face Verification → Exam Starts
                                                            ↓
                                    ┌───────────────────────┴───────────────────────┐
                                    ↓                                               ↓
                            Continuous Monitoring                          Live Examiner View
                            • Gaze tracking                                • Real-time feed
                            • Audio analysis                               • Violation counter
                            • System monitoring                            • Force end option
                            • Keystroke analysis                           
                                    ↓
                            Violation Detected?
                                    ↓
                            Yes → Snapshot + Log → Count ≥ 3? → Auto End
                                    ↓
                            No → Continue Monitoring
                                    ↓
                            Time Up / Submit → Generate Report
```

### Violation Detection

| Type | Trigger | Severity | Action |
|------|---------|----------|--------|
| Gaze Sideward | Looking left/right >2s | 0.7 | Snapshot + Log |
| Gaze Upward | Looking up >2s | 0.7 | Snapshot + Log |
| Face Missing | No face >5s | 0.9 | Snapshot + Log |
| Audio Speech | Speaking >3s | 0.8 | Snapshot + Audio Recording 🎙️ |
| Audio External | High noise >2s | 0.7 | Snapshot + Audio Recording 🎙️ |
| Tab Switch | Tab change | 0.9 | Instant violation |
| Window Blur | Lost focus | 0.8 | Instant violation |
| Copy/Paste | Paste attempt | 0.9 | Blocked + Log |

**Note**: Downward gaze (20-50°) is allowed for rough sheet usage.

## 🎬 Demo

### Student Exam Interface
- Fullscreen proctored environment
- Live violation counter
- Timer display
- Question navigation
- Auto-submit on violations

### Examiner Dashboard
- Grid view of all active students
- Color-coded violation alerts (🟢 🟡 🟠 🔴)
- Live camera feed access
- Force end exam capability
- Real-time updates

### Admin Panel
- User management
- System configuration
- Violation threshold settings
- AI sensitivity controls
- Global statistics

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Role-based access control
- ✅ JWT authentication
- ✅ HTTPS required for camera/mic
- ✅ Encrypted storage
- ✅ Secure WebRTC
- ✅ No PII in logs
- ✅ Keyboard shortcut blocking
- ✅ Copy/paste prevention
- ✅ DevTools blocking

## 📊 Project Structure

```
cheatlock-ai/
├── client/                      # Next.js frontend
│   ├── app/                     # App router pages
│   │   ├── admin/              # Admin dashboard
│   │   ├── teacher/            # Teacher pages
│   │   ├── examiner/           # Examiner monitoring
│   │   └── student/            # Student exam interface
│   ├── proctoring/             # AI detection modules
│   │   ├── gazeDetector.ts     # Face mesh & gaze tracking
│   │   ├── audioDetector.ts    # Voice monitoring
│   │   ├── systemMonitor.ts    # System tracking
│   │   ├── keystrokeMonitor.ts # Typing analysis
│   │   └── proctoringEngine.ts # Main orchestrator
│   └── utils/                  # Utilities
│       ├── supabase.ts         # Database client
│       ├── webrtc.ts           # Video streaming
│       └── reportGenerator.ts  # PDF reports
├── supabase/                   # Backend
│   ├── schema.sql              # Database schema
│   └── functions/              # Edge functions
│       ├── violation-engine/   # Process violations
│       └── report-generator/   # Generate reports
└── docs/                       # Documentation
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
cd client
vercel
```

### Netlify
```bash
cd client
npm run build
netlify deploy --prod
```

### Supabase Functions
```bash
supabase functions deploy violation-engine
supabase functions deploy report-generator
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## 🧪 Testing

### Test Gaze Detection
1. Look left/right → Violation after 2s
2. Look down → Allowed (rough sheet)
3. Look up → Violation
4. Turn away → Face missing violation

### Test Audio Detection
1. Brief noise → Allowed
2. Speaking → Violation after 3s
3. Conversation → External audio violation

### Test System Monitoring
1. Switch tabs → Instant violation
2. Blur window → Instant violation
3. Try paste → Blocked + violation

## 📈 Performance

- **AI Processing**: Client-side (no server load)
- **Real-time Updates**: <100ms latency
- **WebRTC Streaming**: Peer-to-peer (low latency)
- **Database**: Indexed queries (<50ms)
- **Scalability**: Serverless auto-scaling

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- 📖 Check [QUICK_START.md](QUICK_START.md) for setup help
- 📚 Read [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for detailed instructions
- 🐛 Report issues on GitHub
- 💬 Join our community discussions

## 🎓 Use Cases

- **Universities**: Online exams and assessments
- **Certification Bodies**: Professional certifications
- **Corporate Training**: Employee assessments
- **Online Courses**: Course completion tests
- **Recruitment**: Technical screening tests

## ⚡ Quick Links

- 📚 [Documentation Index](INDEX.md) - Navigate all docs
- 🚀 [Installation Guide](INSTALLATION.md)
- ✨ [Feature List](FEATURES.md)
- 📖 [API Documentation](docs/API_DOCUMENTATION.md)
- 🚢 [Deployment Guide](docs/DEPLOYMENT.md)
- 🏗️ [Project Structure](PROJECT_STRUCTURE.md)

---

<div align="center">

**Built with ❤️ for secure online education**

[⭐ Star this repo](https://github.com/yourusername/cheatlock-ai) • [🐛 Report Bug](https://github.com/yourusername/cheatlock-ai/issues) • [✨ Request Feature](https://github.com/yourusername/cheatlock-ai/issues)

</div>
