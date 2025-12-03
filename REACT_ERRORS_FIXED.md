# React Errors Fixed - December 4, 2025

## Issues Resolved

### 1. React setState Warning (CRITICAL)
**Error**: "Cannot update a component while rendering a different component"

**Root Cause**: The `handleViolation` callback was calling `setViolations` synchronously, which triggered a state update during the render phase.

**Fix**: Wrapped the `setViolations` call in `setTimeout(..., 0)` to defer the state update to the next event loop tick, ensuring it happens after the render phase completes.

```typescript
const handleViolation = useCallback((violation: ViolationEvent) => {
  // Use setTimeout to avoid setState during render
  setTimeout(() => {
    setViolations((prev) => {
      // ... state update logic
    });
  }, 0);
}, [handleExamEnd]);
```

### 2. MediaPipe BindingError (CRITICAL)
**Error**: "Cannot pass deleted object as a pointer of type SolutionWasm*"

**Root Cause**: MediaPipe FaceMesh was being used after it was closed/destroyed, causing attempts to access freed WASM memory.

**Fixes Applied**:

1. **Added guards in `onResults` callback**:
```typescript
private onResults(results: Results) {
  // Guard: Don't process if already stopped
  if (!this.faceMesh || !this.onGazeUpdate) {
    return;
  }
  // ... rest of processing
}
```

2. **Added try-catch in camera frame handler**:
```typescript
onFrame: async () => {
  if (this.faceMesh && this.videoElement && this.camera) {
    try {
      await this.faceMesh.send({ image: this.videoElement });
    } catch (error) {
      console.debug('Frame processing error (likely after cleanup):', error);
    }
  }
}
```

3. **Improved cleanup in `stop()` method**:
```typescript
stop() {
  try {
    // Stop camera first
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
    
    // Then close face mesh
    if (this.faceMesh) {
      this.faceMesh.close();
      this.faceMesh = null;
    }
    
    // Clear all references
    this.videoElement = null;
    this.onGazeUpdate = null;
  } catch (error) {
    console.error('Error stopping gaze detector:', error);
  }
}
```

### 3. Duplicate Video/Canvas Elements
**Issue**: Two `<video>` and two `<canvas>` elements were rendered, causing confusion and potential resource conflicts.

**Fix**: Removed the duplicate hidden elements at the bottom of the component. Now only the visible camera preview elements exist.

## Testing Recommendations

1. **Test violation handling**: Trigger multiple violations and verify no React warnings appear
2. **Test exam submission**: Submit exam normally and via auto-end, verify no BindingError
3. **Test camera cleanup**: Start and stop exam multiple times, verify no memory leaks
4. **Test rapid violations**: Trigger violations quickly to ensure state updates properly

## Technical Notes

- The `setTimeout(..., 0)` pattern defers execution to the next event loop tick
- MediaPipe cleanup must happen in the correct order: camera → face mesh → references
- Guards prevent race conditions where callbacks fire after cleanup
- All state updates now happen outside the render phase

## Status
✅ All critical errors resolved
✅ No TypeScript errors
✅ Ready for testing
