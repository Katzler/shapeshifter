# Import Loading State Stuck on Failure

**Priority**: Critical
**Category**: Reliability
**Files Affected**:
- `src/components/workspace/ImportLocalData.tsx`
**Estimated Time**: 5 minutes

## Problem

In `ImportLocalData.tsx`, when the import fails, `setLoading(false)` is called in the catch block (line ~130), but on the SUCCESS path, `setLoading` is never reset before `onComplete()` is called. The component unmounts while still in loading state.

More critically: if the import fails, the error message shows but the button stays disabled because `loading` is `true` and never reset.

## Why It Matters

- User sees "Importing..." forever after a failure
- Cannot retry the import
- Must refresh the page to recover

## Acceptance Criteria

- [ ] On success: loading state properly managed before unmount
- [ ] On failure: `setLoading(false)` called so user can retry
- [ ] Button becomes clickable again after error
- [ ] Tests pass
- [ ] No new warnings/errors

## Notes

The success path calls `onComplete()` which unmounts the component, so the loading state reset there is less critical. But the failure path definitely needs the fix.
