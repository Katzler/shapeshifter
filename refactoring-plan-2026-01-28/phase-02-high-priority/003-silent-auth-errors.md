# Silent Auth Context Errors

**Priority**: High
**Category**: Reliability
**Files Affected**:
- `src/store/AuthContext.tsx` (lines 101-104, 136-139)
**Estimated Time**: 15 minutes

## Problem

`refreshMemberships()` and `refreshInvites()` log errors to console but don't expose error state. If network fails:

1. User sees empty workspace list
2. User sees empty invites list
3. No indication that something went wrong
4. No retry mechanism

## Why It Matters

- Users think they have no workspaces when network is down
- Can't distinguish "no data" from "failed to load"
- Poor UX for flaky connections

## Acceptance Criteria

- [ ] Add `membershipsError` and `invitesError` states to AuthContext
- [ ] Expose error states to consuming components
- [ ] Components can show appropriate error UI
- [ ] Consider adding retry functionality
- [ ] Tests pass
- [ ] No new warnings/errors

## Notes

At minimum, expose a boolean `hasError` state. Better: expose the error object so UI can show specific messages.
