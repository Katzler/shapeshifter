# Phase 3: Improvements

Medium and low priority issues. Fix when convenient or when touching related code.

## Tasks

### Medium Priority

1. **Layer Violation - Direct Supabase Calls** - Components import `supabase` directly instead of using service layer. All 5 workspace components + auth context have this issue.

2. **Weak Email Validation** - `validateEmail()` only checks for `@` and `.` presence. Allows malformed emails like `@.` or `user@@domain`.

3. **Dead Noop Functions** - `createWorkspace()`, `deleteWorkspace()`, `importAsNewWorkspace()` in SupabaseAppProvider are stubs that console.warn. They satisfy the interface but crash/confuse if actually called.

4. **Partial Import No Rollback** - ImportLocalData processes workspaces sequentially. If 3rd fails, 2 are imported but localStorage is cleared. User loses data with partial import.

5. **Accept Invite Inconsistent State** - In PendingInvites, if adding member succeeds but deleting invite fails, user is a member but invite still exists.

### Low Priority

6. **Invite Modal Loading State on Success** - Button stays disabled during 1.5s success timeout. Minor UX issue.

7. **Stale Workspace Permission Check** - If user is removed from workspace by admin while viewing it, SupabaseAppProvider still tries to load it.

## Notes

The **layer violation** is the most important architectural issue. It would be worth addressing when doing any significant changes to these components.
