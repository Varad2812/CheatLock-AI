# Live Camera Feed & Report Generation Guide

## Overview
CheatLock AI provides real-time monitoring capabilities and comprehensive report generation for exam proctoring.

## Live Camera Feed

### How It Works

1. **Student Side (Automatic)**
   - When a student starts an exam, their camera feed is automatically broadcast
   - Uses WebRTC peer-to-peer connection via Supabase Realtime
   - Stream continues throughout the exam duration
   - Automatically stops when exam is submitted or ended

2. **Examiner Side (Manual)**
   - Navigate to `/examiner/monitor/[examId]`
   - View all students currently taking the exam
   - Click "View Live" to connect to a student's camera feed
   - Real-time violation alerts appear automatically

### Features

#### Live Monitoring Dashboard
- **Grid View**: See all active students at a glance
- **Violation Counter**: Real-time violation count (0/3, 1/3, 2/3, 3/3)
- **Status Indicators**: See exam status and start time
- **Recent Violations**: View last 3 violations for each student

#### Live Stream Modal
- **HD Video Feed**: Real-time camera stream from student
- **Connection Status**: Visual indicator when stream is connected
- **Snapshot Capture**: Take screenshots during the exam
- **Force End**: Manually terminate a student's exam if needed
- **Violation Timeline**: See all violations in chronological order

#### Real-time Updates
- Automatic refresh when new violations are detected
- Live notification toasts for violation events
- WebSocket-based updates via Supabase Realtime

### Technical Implementation

```typescript
// Student broadcasts stream
const streamer = new WebRTCStreamer(attemptId);
await streamer.startBroadcast(videoElement);

// Examiner connects to stream
const streamer = new WebRTCStreamer(attemptId);
await streamer.connectToStream(videoElement, (stream) => {
  console.log('Connected!');
});
```

### Troubleshooting Live Feed

**Stream Not Connecting:**
- Ensure student has started the exam
- Check camera permissions are granted
- Verify Supabase Realtime is enabled
- Check browser console for WebRTC errors

**Poor Video Quality:**
- Check network bandwidth
- Reduce number of simultaneous streams
- Consider adjusting video resolution in `webrtc.ts`

**Connection Drops:**
- WebRTC will attempt to reconnect automatically
- Examiner can close and reopen the stream
- Check firewall/NAT settings

## Report Generation

### Accessing Reports

1. **Teacher Dashboard** → Select Exam → Click "Reports"
2. View all exam attempts in a comprehensive table
3. Click "Report" button to generate PDF for any attempt

### Report Contents

#### 1. Header Section
- CheatLock AI branding
- Report generation timestamp
- Document title

#### 2. Student Information
- Full name
- Email address
- Attempt ID (for reference)

#### 3. Exam Information
- Exam title and description
- Duration and total marks
- Start and submission times
- Status (completed/auto-ended)
- Auto-end warning if applicable

#### 4. Statistics Summary
- Final score (if available)
- Total violation count
- High-severity violation count
- Violation breakdown by type:
  - Gaze violations (sideward, upward, away)
  - Face missing
  - Audio violations (speech, external noise)
  - Tab switching
  - Window blur
  - Copy/paste attempts
  - Keystroke anomalies

#### 5. Detailed Violations
- Chronological list of all violations
- Timestamp for each violation
- Severity percentage
- Description of what was detected

#### 6. Cheating Risk Assessment
- **Overall Risk Score**: 0-100%
- **Risk Level**: Low / Medium / High
- **Risk Factors**:
  - High violation count
  - High-severity violations
  - Auto-ended exam
- **Recommendations**:
  - Manual review suggestions
  - Re-examination recommendations
  - Snapshot review guidance

### Risk Score Calculation

```
Base Score = violations × 0.15
Severity Score = Σ(violation.severity × 0.2)
High Severity Bonus = high_severity_count × 0.25
Final Score = min(Base + Severity + Bonus, 1.0)
```

**Risk Levels:**
- **Low Risk** (0-30%): Standard review sufficient
- **Medium Risk** (30-70%): Manual review recommended
- **High Risk** (70-100%): Strong manual review + possible re-exam

### Report Features

#### Visual Indicators
- Color-coded risk levels (green/orange/red)
- Status icons (checkmark/warning/error)
- Professional formatting with proper spacing

#### Data Accuracy
- All timestamps in local timezone
- Precise violation counts
- Calculated scores based on actual answers
- Real violation data from database

#### Export Options
- PDF format (automatic download)
- Filename includes student name and date
- Print-ready formatting

### Reports Dashboard

#### Summary Statistics
- Total attempts count
- Completed exams count
- Auto-ended exams count
- Average score across all attempts

#### Sortable Table
- Student name and email
- Status with visual indicators
- Score display
- Violation count with color coding
- Risk level badges
- Start timestamp
- Quick report generation

### Using Reports

**For Teachers:**
1. Review all attempts after exam completion
2. Identify high-risk submissions
3. Generate reports for flagged students
4. Use reports for academic integrity reviews
5. Share reports with administration if needed

**For Administrators:**
1. Monitor exam integrity across courses
2. Track violation patterns
3. Identify students needing intervention
4. Generate evidence for academic misconduct cases

## API Integration

### Generate Report Programmatically

```typescript
import { ReportGenerator } from '@/utils/reportGenerator';

const generator = new ReportGenerator();
const pdfBlob = generator.generatePDF(reportData);

// Download
const url = URL.createObjectURL(pdfBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'report.pdf';
a.click();
```

### Backend Report Generation

```bash
# Deploy Supabase Edge Function
supabase functions deploy report-generator

# Call from frontend
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/report-generator`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ attemptId }),
  }
);
```

## Database Schema

### Required Tables

```sql
-- Exam attempts with risk scores
exam_attempts (
  id, exam_id, student_id,
  started_at, submitted_at,
  auto_ended, violation_count,
  final_score, cheating_risk_score,
  answers, status
)

-- Violations log
violations (
  id, attempt_id,
  violation_type, severity,
  description, snapshot_url,
  detected_at
)

-- Reports storage
reports (
  id, attempt_id, generated_by,
  report_data, pdf_url,
  created_at
)
```

## Security Considerations

### Live Feed Security
- WebRTC connections are peer-to-peer (encrypted)
- Only authorized examiners can view streams
- Streams are not recorded by default
- Camera access requires explicit permission

### Report Security
- Reports contain sensitive student data
- Access restricted by RLS policies
- Only teachers and admins can generate reports
- PDF downloads are client-side (no server storage)

## Performance Optimization

### Live Streaming
- Limit concurrent streams to 5-10 per examiner
- Use lower resolution for bandwidth savings
- Implement connection pooling for multiple exams

### Report Generation
- Generate reports on-demand (not pre-generated)
- Use client-side PDF generation to reduce server load
- Cache violation data during generation
- Implement pagination for large exam classes

## Future Enhancements

### Planned Features
- [ ] Recording capability for live streams
- [ ] Batch report generation (all students at once)
- [ ] Email report delivery
- [ ] Report templates customization
- [ ] Analytics dashboard with charts
- [ ] Violation heatmaps
- [ ] AI-powered risk prediction
- [ ] Integration with LMS platforms

## Support

For issues with live monitoring or reports:
1. Check browser console for errors
2. Verify database permissions (RLS policies)
3. Test WebRTC connectivity
4. Review Supabase Realtime status
5. Check PDF generation library (jsPDF) compatibility
