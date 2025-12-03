# CheatLock AI - Complete Testing Guide

## Prerequisites

1. **Environment Setup**
   ```bash
   cd client
   npm install
   ```

2. **Environment Variables**
   - Ensure `.env.local` has correct Supabase credentials
   - Verify Supabase project is running
   - Check database tables exist (run schema.sql)

3. **Database Setup**
   ```bash
   # Run in Supabase SQL Editor
   # 1. Execute supabase/schema.sql
   # 2. Execute supabase/add_classes.sql
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Test Scenarios

### Scenario 1: Complete Exam Flow with Violations

#### Step 1: Create Teacher Account
1. Navigate to `/auth/register`
2. Register with:
   - Email: `teacher@test.com`
   - Password: `Test123!`
   - Full Name: `Test Teacher`
   - Role: `teacher`
3. Verify redirect to teacher dashboard

#### Step 2: Create Exam
1. Click "Create New Exam"
2. Fill in:
   - Title: `Math Final Exam`
   - Description: `Final examination for Math 101`
   - Duration: `30` minutes
   - Total Marks: `100`
   - Proctoring Strictness: `0.7`
3. Click "Create Exam"
4. Verify exam appears in dashboard

#### Step 3: Add Questions
1. Click "Questions" on the exam card
2. Add MCQ Question:
   - Question: `What is 2 + 2?`
   - Type: `Multiple Choice`
   - Options: `2, 3, 4, 5`
   - Correct Answer: `4`
   - Marks: `10`
3. Add 2-3 more questions
4. Verify questions appear in list

#### Step 4: Activate Exam
1. Go back to teacher dashboard
2. Toggle exam to "Active"
3. Verify status changes to green "Active"

#### Step 5: Create Student Account
1. Open new incognito window
2. Navigate to `/auth/register`
3. Register with:
   - Email: `student@test.com`
   - Password: `Test123!`
   - Full Name: `Test Student`
   - Role: `student`
4. Verify redirect to student dashboard

#### Step 6: Start Exam
1. Verify exam appears in "Available Exams"
2. Click "Take Exam"
3. Review exam details
4. Allow camera access when prompted
5. Verify camera preview shows
6. Click "Start Exam"
7. Verify exam interface loads
8. Verify timer starts counting down

#### Step 7: Answer Questions
1. Select answer for first question
2. Verify only one option can be selected
3. Click "Next"
4. Answer 2-3 questions
5. Verify answers are saved (check by going back)

#### Step 8: Trigger Violations
1. **Gaze Violation**: Look away from screen for 3-5 seconds
2. **Audio Violation**: Make noise or speak
3. **Tab Switch**: Press Alt+Tab (or Cmd+Tab on Mac)
4. Verify violation counter increases (0/3 → 1/3 → 2/3)
5. Verify toast notifications appear

#### Step 9: Monitor Live (Examiner)
1. Open third browser window
2. Register as examiner:
   - Email: `examiner@test.com`
   - Role: `examiner`
3. Navigate to `/examiner/monitor/[examId]`
   - Get examId from URL in student window
4. Verify student appears in monitoring grid
5. Verify violation count shows correctly
6. Click "View Live"
7. Verify video stream connects
8. Verify "LIVE" indicator appears
9. Click "Capture Snapshot"
10. Verify image downloads
11. Trigger another violation in student window
12. Verify violation appears in real-time

#### Step 10: Test Auto-End (3 Violations)
1. In student window, trigger 3rd violation
2. Verify exam ends automatically
3. Verify toast: "Exam ended: 3 violations detected"
4. Verify redirect to student dashboard
5. Check database:
   ```sql
   SELECT * FROM exam_attempts WHERE student_id = 'student_id';
   -- Verify: auto_ended = true, violation_count = 3
   ```

#### Step 11: Manual Submit (Alternative)
1. Start new exam attempt
2. Answer all questions
3. Click "Submit Exam"
4. Verify confirmation toast
5. Verify redirect to dashboard
6. Verify attempt shows in "Completed Exams"

#### Step 12: Generate Report
1. Switch to teacher window
2. Click "Reports" on exam card
3. Verify attempt appears in table
4. Verify statistics are correct:
   - Total attempts
   - Completed count
   - Auto-ended count
   - Average score
5. Click "Report" button for the attempt
6. Verify PDF downloads
7. Open PDF and verify:
   - Student information correct
   - Exam details correct
   - Score calculated correctly
   - All violations listed
   - Risk score displayed
   - Recommendations present

### Scenario 2: Clean Exam (No Violations)

#### Steps
1. Create new student account
2. Start exam
3. Complete all questions without violations
4. Submit exam
5. Generate report
6. Verify:
   - Violation count = 0
   - Risk score = Low
   - Status = Completed (not auto-ended)
   - Full score if all answers correct

### Scenario 3: Multiple Students Simultaneously

#### Steps
1. Create 3 student accounts
2. Have all 3 start the same exam
3. Open examiner monitor
4. Verify all 3 students appear
5. Connect to each student's stream one by one
6. Verify streams work independently
7. Trigger violations in different students
8. Verify real-time updates for all

### Scenario 4: Edge Cases

#### Test 4.1: Camera Permission Denied
1. Start exam
2. Deny camera permission
3. Verify exam still starts (with warning)
4. Verify proctoring shows as unavailable
5. Verify exam can still be completed

#### Test 4.2: Network Interruption
1. Start exam
2. Disconnect internet briefly
3. Reconnect
4. Verify exam continues
5. Verify violations still recorded

#### Test 4.3: Browser Refresh
1. Start exam
2. Refresh browser
3. Verify redirect to dashboard
4. Verify attempt marked as incomplete

#### Test 4.4: Time Expiry
1. Create exam with 1 minute duration
2. Start exam
3. Wait for timer to reach 0
4. Verify auto-submit occurs
5. Verify answers saved

## Verification Checklist

### Database Verification

```sql
-- Check users created
SELECT id, email, role FROM users;

-- Check exam created
SELECT * FROM exams;

-- Check questions added
SELECT * FROM questions WHERE exam_id = 'exam_id';

-- Check exam attempts
SELECT 
  ea.*,
  u.full_name as student_name
FROM exam_attempts ea
JOIN users u ON ea.student_id = u.id;

-- Check violations recorded
SELECT 
  v.*,
  ea.student_id
FROM violations v
JOIN exam_attempts ea ON v.attempt_id = ea.id
ORDER BY v.detected_at DESC;

-- Check proctoring logs
SELECT * FROM proctoring_logs 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Browser Console Checks

**Student Exam Page:**
```
✓ "Exam loaded: {exam data}"
✓ "Questions loaded: X questions"
✓ "Proctoring engine started successfully"
✓ "Violation recorded: {violation data}"
✓ "Submitting exam..."
✓ "Exam attempt updated successfully"
```

**Examiner Monitor:**
```
✓ "Stream connected successfully"
✓ "Video metadata loaded"
✓ "Snapshot captured"
```

### Network Tab Checks

**During Exam:**
- WebSocket connection to Supabase Realtime
- Periodic proctoring log inserts
- Violation inserts when triggered

**During Report Generation:**
- Single query to fetch attempt data
- Single query to fetch violations
- PDF blob creation (no upload)

## Performance Testing

### Load Test: Multiple Students
1. Create 10 student accounts
2. Have all start exam simultaneously
3. Monitor:
   - Database query performance
   - WebRTC connection stability
   - Browser memory usage
   - Network bandwidth

**Expected Results:**
- All students can start exam
- Violations recorded for all
- Examiner can monitor all
- No significant lag

### Stress Test: Rapid Violations
1. Start exam
2. Trigger violations rapidly (10+ in 1 minute)
3. Verify:
   - All violations recorded
   - No duplicate entries
   - Exam ends at 3 violations
   - No crashes or errors

## Bug Testing

### Known Issues to Verify Fixed

1. **MCQ Auto-Selection** ✅
   - Select option A
   - Navigate to next question
   - Go back
   - Verify option A still selected
   - Select option B
   - Verify only B is selected (A deselected)

2. **Exam Not Saving** ✅
   - Complete exam
   - Submit
   - Check database
   - Verify answers JSON populated
   - Verify final_score calculated
   - Verify status = 'completed'

3. **Violations Not Recording** ✅
   - Trigger violation
   - Check database immediately
   - Verify violation row inserted
   - Verify attempt violation_count updated

4. **3 Violations Not Ending Exam** ✅
   - Trigger 3 violations
   - Verify exam ends automatically
   - Verify auto_ended = true
   - Verify status updated

5. **Submit Button Not Working** ✅
   - Answer questions
   - Click submit
   - Verify no errors in console
   - Verify redirect occurs
   - Verify data saved

## Accessibility Testing

1. **Keyboard Navigation**
   - Tab through form fields
   - Use Enter to submit
   - Use Space to select radio buttons

2. **Screen Reader**
   - Test with NVDA/JAWS
   - Verify labels are read
   - Verify error messages announced

3. **Color Contrast**
   - Verify text readable
   - Verify buttons have sufficient contrast
   - Test with color blindness simulator

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

## Security Testing

1. **Authentication**
   - Try accessing teacher pages as student
   - Try accessing admin pages as teacher
   - Verify redirects occur

2. **Authorization**
   - Try viewing other student's attempts
   - Try editing other teacher's exams
   - Verify RLS blocks unauthorized access

3. **Data Validation**
   - Submit exam with empty answers
   - Try negative marks
   - Try invalid exam duration
   - Verify validation works

## Reporting Issues

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser console errors
5. Network tab screenshots
6. Database state (if relevant)

## Success Criteria

All tests pass when:
- ✅ Users can register and login
- ✅ Teachers can create exams and questions
- ✅ Students can take exams
- ✅ Violations are detected and recorded
- ✅ Exam auto-ends at 3 violations
- ✅ Manual submit works correctly
- ✅ Live camera feed connects
- ✅ Reports generate correctly
- ✅ All data persists to database
- ✅ No console errors
- ✅ Responsive on mobile
- ✅ Accessible to screen readers

## Next Steps After Testing

1. Fix any bugs found
2. Optimize performance bottlenecks
3. Add missing features
4. Improve error messages
5. Enhance UI/UX based on feedback
6. Prepare for production deployment
