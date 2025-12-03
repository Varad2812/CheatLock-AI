# Debug Auto-Submit Issue

## Enhanced Logging Added

The code now has comprehensive logging at every step. Open browser console (F12) and watch for these messages:

### When Violation Occurs

```
=== VIOLATION HANDLER CALLED ===
Violation: { type: 'tab_switch', severity: 0.9, description: '...', ... }
=== VIOLATION STATE UPDATE ===
Previous violations: 0
New violations: 1
Threshold: 5
```

### When Threshold Reached

```
=== VIOLATION STATE UPDATE ===
Previous violations: 4
New violations: 5
Threshold: 5
=== THRESHOLD REACHED - TRIGGERING AUTO-END ===
Violation count: 5, Threshold: 5
=== CALLING handleExamEnd ===
```

### When Exam Ends

```
=== HANDLE EXAM END CALLED ===
Reason: 5 violations detected
Current isSubmitting: false
=== CALLING handleSubmit(true) ===
```

### When Submit Starts

```
=== HANDLE SUBMIT CALLED ===
autoEnded: true
attempt: { id: '...', ... }
isSubmitting: false
=== SETTING isSubmitting = true ===
=== STARTING SUBMISSION PROCESS ===
Submitting exam... { attemptId: '...', autoEnded: true, answersCount: 3 }
Stopping proctoring engine
Score calculated: { score: 30, correctAnswers: 3, totalQuestions: 5 }
Updating exam attempt: { ... }
Exam attempt updated successfully: [...]
Exam submitted successfully!
```

## Debugging Steps

### Step 1: Trigger Violations

1. Start exam
2. Open browser console (F12)
3. Tab switch 5 times (wait 3 seconds between each)
4. Watch console for each violation

**Expected Output After Each Violation:**
```
=== VIOLATION HANDLER CALLED ===
=== VIOLATION STATE UPDATE ===
Previous violations: X
New violations: X+1
Threshold: 5
```

### Step 2: Check Threshold Detection

After 5th violation, you should see:
```
=== THRESHOLD REACHED - TRIGGERING AUTO-END ===
Violation count: 5, Threshold: 5
=== CALLING handleExamEnd ===
```

**If you DON'T see this:**
- Threshold might not be 5
- Check: `console.log(proctoringEngineRef.current?.getViolationThreshold())`
- Violations might not be counting correctly

### Step 3: Check Exam End Call

After threshold reached, you should see:
```
=== HANDLE EXAM END CALLED ===
Reason: 5 violations detected
Current isSubmitting: false
=== CALLING handleSubmit(true) ===
```

**If you DON'T see this:**
- `handleExamEnd` is not being called
- Check if setTimeout is executing
- Try increasing setTimeout delay from 100ms to 500ms

### Step 4: Check Submit Call

After exam end, you should see:
```
=== HANDLE SUBMIT CALLED ===
autoEnded: true
attempt: { id: '...', ... }
isSubmitting: false
=== SETTING isSubmitting = true ===
=== STARTING SUBMISSION PROCESS ===
```

**If you see "ALREADY SUBMITTING - IGNORING":**
- `isSubmitting` is stuck at `true`
- Reset it: `setIsSubmitting(false)` in console
- Or refresh page and try again

**If you see "ERROR: No attempt found":**
- Exam attempt wasn't created
- Check if `startExam()` succeeded
- Check database for exam_attempts record

### Step 5: Check Database Update

After submission starts, you should see:
```
Updating exam attempt: { submitted_at: '...', status: 'completed', auto_ended: true, ... }
Exam attempt updated successfully: [...]
```

**If you see "Update error":**
- Database RLS policy blocking update
- Check Supabase logs
- Verify user has permission to update their attempt

## Common Issues & Solutions

### Issue 1: No Logs Appearing

**Problem**: Console shows nothing when violations occur

**Check**:
```javascript
// In browser console:
console.log('Proctoring engine:', proctoringEngineRef.current);
console.log('Violations:', violations);
```

**Solution**:
- Proctoring engine might not be initialized
- Check for errors during `engine.start()`
- Verify camera/microphone permissions granted

### Issue 2: Violations Count But Don't Trigger Auto-End

**Problem**: See violations 1/5, 2/5, 3/5, 4/5, 5/5 but exam doesn't end

**Check Console For**:
```
=== THRESHOLD REACHED - TRIGGERING AUTO-END ===
```

**If Missing**:
- Threshold check is failing
- Check: `violationCount >= threshold`
- Verify threshold value

**Solution**:
```javascript
// In browser console after 5th violation:
console.log('Violations length:', violations.length);
console.log('Threshold:', proctoringEngineRef.current?.getViolationThreshold());

// Manually trigger if needed:
handleExamEnd('Manual trigger for testing');
```

### Issue 3: Exam End Called But Submit Doesn't Start

**Problem**: See "HANDLE EXAM END CALLED" but no "HANDLE SUBMIT CALLED"

**Check**:
- Is `handleSubmit` defined?
- Is it in the dependency array of `handleExamEnd`?

**Solution**:
```javascript
// In browser console:
console.log('handleSubmit type:', typeof handleSubmit);

// Manually call:
handleSubmit(true);
```

### Issue 4: Submit Called But isSubmitting Blocks It

**Problem**: See "ALREADY SUBMITTING - IGNORING"

**Solution**:
```javascript
// In browser console:
setIsSubmitting(false);

// Then manually trigger:
handleSubmit(true);
```

### Issue 5: Database Update Fails

**Problem**: See "Update error" in console

**Check Supabase Logs**:
1. Go to Supabase Dashboard
2. Click "Logs" → "Postgres Logs"
3. Look for RLS policy errors

**Common RLS Issues**:
```sql
-- Check if student can update their own attempt
SELECT * FROM exam_attempts WHERE student_id = auth.uid();

-- If RLS is blocking, temporarily disable for testing:
ALTER TABLE exam_attempts DISABLE ROW LEVEL SECURITY;

-- Test submission, then re-enable:
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
```

## Manual Testing Commands

### Check Current State
```javascript
// In browser console during exam:
console.log('Exam Started:', examStarted);
console.log('Violations:', violations.length);
console.log('Threshold:', proctoringEngineRef.current?.getViolationThreshold());
console.log('Is Submitting:', isSubmitting);
console.log('Attempt:', attempt);
```

### Force Violation
```javascript
// Manually add violation:
handleViolation({
  type: 'tab_switch',
  severity: 0.9,
  description: 'Manual test violation',
  timestamp: Date.now()
});
```

### Force Auto-End
```javascript
// Manually trigger exam end:
handleExamEnd('Manual test trigger');
```

### Force Submit
```javascript
// Manually submit:
handleSubmit(true);
```

## Expected Full Flow

When working correctly, you should see this exact sequence:

```
1. === VIOLATION HANDLER CALLED ===
2. === VIOLATION STATE UPDATE === (Previous: 4, New: 5)
3. === THRESHOLD REACHED - TRIGGERING AUTO-END ===
4. === CALLING handleExamEnd ===
5. === HANDLE EXAM END CALLED ===
6. === CALLING handleSubmit(true) ===
7. === HANDLE SUBMIT CALLED ===
8. === SETTING isSubmitting = true ===
9. === STARTING SUBMISSION PROCESS ===
10. Submitting exam...
11. Stopping proctoring engine
12. Score calculated: {...}
13. Updating exam attempt: {...}
14. Exam attempt updated successfully: [...]
15. Exam submitted successfully!
16. [Redirect to dashboard]
```

**If any step is missing, that's where the problem is!**

## Quick Fix

If auto-submit still doesn't work after checking all logs:

1. **Increase setTimeout delay**:
```typescript
// In handleViolation, change:
setTimeout(() => {
  handleExamEnd(`${threshold} violations detected`);
}, 500); // Increased from 100ms
```

2. **Remove setTimeout entirely**:
```typescript
// In handleViolation, change:
if (violationCount >= threshold) {
  handleExamEnd(`${threshold} violations detected`); // Direct call
}
```

3. **Add window-level function** (last resort):
```typescript
// At top of component:
useEffect(() => {
  (window as any).forceSubmit = () => handleSubmit(true);
}, [handleSubmit]);

// Then in console:
window.forceSubmit();
```

## Report Back

When reporting the issue, please provide:

1. **Full console output** from start of exam to 5th violation
2. **Screenshot** of console showing all === logs
3. **Which step** in the expected flow is missing
4. **Database state**:
   ```sql
   SELECT * FROM exam_attempts ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM violations ORDER BY detected_at DESC LIMIT 5;
   ```

This will help identify exactly where the flow is breaking!
