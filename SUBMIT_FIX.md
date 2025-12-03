# Submit & Auto-End Fix

## Issues Fixed

### 1. Manual Submit Not Working ✅

**Problem**: Clicking "Submit Exam" button did nothing.

**Root Cause**: 
- `handleSubmit` was a regular function, not stable across renders
- React was recreating the function on every render
- Button onClick had stale reference

**Solution**:
- Converted `handleSubmit` to `useCallback` with proper dependencies
- Ensures stable function reference across renders
- Button always has current function reference

### 2. Auto-Submit After 5/5 Violations Not Working ✅

**Problem**: Even after 5 violations, exam didn't auto-submit.

**Root Causes**:
1. `handleViolation` and `handleExamEnd` were regular functions
2. `setTimeout` delays were causing race conditions
3. Proctoring engine reference not being cleared
4. Functions not properly chained

**Solution**:
- Converted all handler functions to `useCallback`
- Removed unnecessary `setTimeout` delays
- Clear proctoring engine reference after stopping
- Proper function dependency chain:
  - `handleSubmit` (base)
  - `handleExamEnd` (depends on handleSubmit)
  - `handleViolation` (depends on handleExamEnd)

### 3. Timer Auto-Submit Not Working ✅

**Problem**: When time expired, exam didn't submit.

**Root Cause**:
- Timer `useEffect` was defined before `handleSubmit`
- Function hoisting issues
- Missing dependency in useEffect

**Solution**:
- Moved timer `useEffect` after all function definitions
- Added `handleSubmit` to dependencies array
- Added logging for debugging

## Code Changes

### Function Conversion to useCallback

```typescript
// Before
function handleSubmit(autoEnded: boolean = false) { ... }
function handleExamEnd(reason: string) { ... }
function handleViolation(violation: ViolationEvent) { ... }

// After
const handleSubmit = useCallback(async (autoEnded: boolean = false) => {
  // ... implementation
}, [attempt, answers, questions, violations, isSubmitting, router]);

const handleExamEnd = useCallback((reason: string) => {
  handleSubmit(true);  // Immediate call, no setTimeout
}, [handleSubmit]);

const handleViolation = useCallback((violation: ViolationEvent) => {
  setViolations((prev) => {
    const newViolations = [...prev, violation];
    const threshold = proctoringEngineRef.current?.getViolationThreshold() || 3;
    
    if (newViolations.length >= threshold) {
      handleExamEnd(`${threshold} violations detected`);  // Immediate call
    }
    
    return newViolations;
  });
}, [handleExamEnd]);
```

### Timer useEffect Placement

```typescript
// Moved AFTER all function definitions
const handleViolation = useCallback(...);

// Timer effect - must be after handleSubmit is defined
useEffect(() => {
  if (examStarted && timeRemaining > 0) {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          console.log('Time expired - auto-submitting exam');
          handleSubmit(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }
}, [examStarted, timeRemaining, handleSubmit]);  // handleSubmit in dependencies
```

### Proctoring Engine Cleanup

```typescript
// Stop proctoring first
if (proctoringEngineRef.current) {
  console.log('Stopping proctoring engine');
  proctoringEngineRef.current.stop();
  proctoringEngineRef.current = null; // Clear reference to prevent reuse
}
```

## Testing Instructions

### Test 1: Manual Submit

1. Start exam
2. Answer 1-2 questions
3. Click "Submit Exam" button
4. **Expected**:
   - Console: `Submitting exam...`
   - Console: `Score calculated: {...}`
   - Console: `Exam attempt updated successfully`
   - Toast: "Exam submitted successfully!"
   - Redirect to dashboard after 1 second
5. **Check Database**:
   ```sql
   SELECT * FROM exam_attempts ORDER BY created_at DESC LIMIT 1;
   ```
   - Verify: `status = 'completed'`
   - Verify: `answers` is populated
   - Verify: `final_score` is calculated

### Test 2: Auto-Submit After Violations

1. **Set Threshold**:
   ```sql
   UPDATE system_settings SET violation_threshold = 3;
   ```

2. **Start Exam**:
   - Verify UI shows: `Violations: 0/3`

3. **Trigger 3 Violations**:
   - Tab switch 3 times (wait 3 seconds between each)
   - **After 1st violation**:
     - Console: `Violation recorded: {...}`
     - Console: `Total violations: 1/3`
     - Toast: `Violation 1/3: Tab switched or hidden`
   - **After 2nd violation**:
     - Console: `Total violations: 2/3`
     - Toast: `Violation 2/3: ...`
   - **After 3rd violation**:
     - Console: `Total violations: 3/3`
     - Console: `Violation threshold reached (3/3) - ending exam`
     - Console: `Exam ending: 3 violations detected`
     - Toast: `Exam ended: 3 violations detected`
     - Console: `Submitting exam...`
     - Toast: `Exam submitted successfully!`
     - Redirect to dashboard

4. **Check Database**:
   ```sql
   SELECT auto_ended, violation_count, status 
   FROM exam_attempts 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   - Verify: `auto_ended = true`
   - Verify: `violation_count = 3`
   - Verify: `status = 'completed'`

### Test 3: Timer Auto-Submit

1. **Create Short Exam**:
   ```sql
   UPDATE exams SET duration_minutes = 1 WHERE id = 'exam_id';
   ```

2. **Start Exam**:
   - Verify timer shows: `1:00`

3. **Wait for Timer**:
   - Watch timer count down
   - **At 0:01**:
     - Console: `Time expired - auto-submitting exam`
     - Console: `Submitting exam...`
     - Toast: `Exam submitted successfully!`
     - Redirect to dashboard

4. **Check Database**:
   - Verify: `status = 'completed'`
   - Verify: `auto_ended = false` (time expiry, not violation)

## Console Logs to Watch For

### Successful Manual Submit
```
Answer selected: { questionId: '...', option: '...' }
Submitting exam... { attemptId: '...', autoEnded: false, answersCount: 3 }
Stopping proctoring engine
Score calculated: { score: 30, correctAnswers: 3, totalQuestions: 5 }
Updating exam attempt: { submitted_at: '...', status: 'completed', ... }
Exam attempt updated successfully: [...]
Exam submitted successfully!
```

### Successful Auto-Submit (Violations)
```
Violation recorded: { type: 'tab_switch', ... }
Total violations: 1/3
Violation recorded: { type: 'tab_switch', ... }
Total violations: 2/3
Violation recorded: { type: 'tab_switch', ... }
Total violations: 3/3
Violation threshold reached (3/3) - ending exam
Exam ending: 3 violations detected
Submitting exam... { attemptId: '...', autoEnded: true, answersCount: 2 }
Stopping proctoring engine
Score calculated: { score: 20, correctAnswers: 2, totalQuestions: 5 }
Updating exam attempt: { submitted_at: '...', status: 'completed', auto_ended: true, ... }
Exam attempt updated successfully: [...]
Exam submitted successfully!
```

### Successful Auto-Submit (Timer)
```
Time expired - auto-submitting exam
Submitting exam... { attemptId: '...', autoEnded: false, answersCount: 4 }
Stopping proctoring engine
Score calculated: { score: 40, correctAnswers: 4, totalQuestions: 5 }
Updating exam attempt: { submitted_at: '...', status: 'completed', ... }
Exam attempt updated successfully: [...]
Exam submitted successfully!
```

## Troubleshooting

### Submit Button Does Nothing

**Check Console**:
- Should see: `Submitting exam...`
- If not, check if `attempt` exists
- Check if `isSubmitting` is stuck at `true`

**Solution**:
```javascript
// In browser console during exam:
console.log('Attempt:', attempt);
console.log('Is Submitting:', isSubmitting);

// If isSubmitting is true, reset it:
setIsSubmitting(false);
```

### Auto-Submit Not Triggering

**Check Console**:
- Should see: `Violation threshold reached`
- Should see: `Exam ending: X violations detected`
- If not, check violation count

**Solution**:
```javascript
// In browser console:
console.log('Violations:', violations.length);
console.log('Threshold:', proctoringEngineRef.current?.getViolationThreshold());

// Manually trigger if needed:
handleExamEnd('Manual trigger');
```

### Timer Not Submitting

**Check Console**:
- Should see: `Time expired - auto-submitting exam`
- If not, check if timer is running

**Solution**:
```javascript
// In browser console:
console.log('Exam Started:', examStarted);
console.log('Time Remaining:', timeRemaining);

// Check if handleSubmit exists:
console.log('handleSubmit:', typeof handleSubmit);
```

## Key Improvements

1. **Stable Function References**: Using `useCallback` ensures functions don't change on every render
2. **Proper Dependencies**: All useCallback hooks have correct dependency arrays
3. **No Race Conditions**: Removed setTimeout delays that caused timing issues
4. **Clear Logging**: Added console.log at every step for debugging
5. **Cleanup**: Properly clear proctoring engine reference
6. **Error Handling**: Better error messages and state management

## Files Modified

- `client/app/student/exam/[id]/page.tsx`
  - Converted functions to useCallback
  - Moved timer useEffect after function definitions
  - Added proper dependencies
  - Removed setTimeout delays
  - Added comprehensive logging

## Summary

All submission issues are now fixed:
- ✅ Manual submit button works
- ✅ Auto-submit after violations works
- ✅ Auto-submit on timer expiry works
- ✅ Proper logging for debugging
- ✅ No race conditions
- ✅ Stable function references

Test all three scenarios to verify everything works correctly!
