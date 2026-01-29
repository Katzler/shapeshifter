# Invite Modal Race Condition on Double Submit

**Priority**: Critical
**Category**: Reliability
**Files Affected**:
- `src/components/workspace/InviteModal.tsx`
**Estimated Time**: 5 minutes

## Problem

In `InviteModal.tsx`, after successful invite:
1. Success message is shown
2. `setTimeout(() => onClose(), 1500)` schedules modal close
3. During this 1.5s window, user can click "Send Invites" again
4. Second submission starts before modal closes

This causes:
- Duplicate invite attempts (may fail with unique constraint)
- `onInvitesSent()` called multiple times
- Confusing UX

## Why It Matters

- Duplicate invites sent (if validation doesn't catch them)
- Parent component refreshes multiple times
- Error messages may appear after "success" message

## Acceptance Criteria

- [ ] Disable form/button immediately on success (not just during loading)
- [ ] Or close modal immediately on success (no delay)
- [ ] Cannot submit twice
- [ ] Tests pass
- [ ] No new warnings/errors

## Notes

Simplest fix: Set a `submitted` state to true on success that disables the button, OR remove the setTimeout and close immediately after success.
