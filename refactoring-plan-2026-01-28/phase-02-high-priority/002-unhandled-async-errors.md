# Unhandled Async Errors in Callbacks

**Priority**: High
**Category**: Reliability
**Files Affected**:
- `src/store/SupabaseAppProvider.tsx` (renameWorkspace callback)
**Estimated Time**: 10 minutes

## Problem

`renameWorkspace` is an async function wrapped in `useCallback`, but it's not properly awaited when called. If the rename fails:

1. Error is logged but not surfaced
2. UI state becomes stale (shows old name)
3. User thinks rename succeeded

## Why It Matters

- Silent failures confuse users
- State becomes inconsistent with database
- No retry mechanism

## Acceptance Criteria

- [ ] Errors from async operations are surfaced to UI
- [ ] Consider adding error state for workspace operations
- [ ] User sees feedback when operation fails
- [ ] Tests pass
- [ ] No new warnings/errors

## Notes

Either make the callback properly handle errors internally with state updates, or change the calling pattern to await and catch.
