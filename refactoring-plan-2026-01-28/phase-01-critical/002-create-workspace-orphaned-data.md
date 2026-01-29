# Create Workspace Orphaned Data on Partial Failure

**Priority**: Critical
**Category**: Reliability
**Files Affected**:
- `src/components/workspace/CreateWorkspace.tsx`
**Estimated Time**: 10 minutes

## Problem

In `CreateWorkspace.tsx`, if workspace creation succeeds but adding the member fails, we attempt to rollback by deleting the workspace. However:

1. The rollback delete can silently fail
2. No error is shown to user about the rollback failure
3. Orphaned workspace record remains in database

## Why It Matters

- Database contains workspace with no members
- Workspace is invisible but takes up space
- Data integrity violation
- No way for user to know what happened

## Acceptance Criteria

- [ ] If rollback fails, show appropriate error message
- [ ] Consider using a transaction or Supabase function for atomic operation
- [ ] User understands what went wrong
- [ ] Tests pass
- [ ] No new warnings/errors

## Notes

Ideal fix: Use a Supabase database function that creates workspace + member in a transaction. Fallback: At minimum, surface the rollback failure to the user.
