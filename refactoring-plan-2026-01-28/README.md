# Refactoring Plan - Supabase Integration

**Date**: 2026-01-28
**Scope**: Recent Supabase/auth/workspace changes
**Architecture**: Layered (types → domain → infrastructure → store → components)

## Summary

| Phase | Issues | Description |
|-------|--------|-------------|
| Phase 1 | 3 | Critical bugs that cause data loss or broken UI |
| Phase 2 | 4 | High priority issues affecting reliability |
| Phase 3 | 8 | Medium/Low improvements for maintainability |

## Execution Order

### Phase 1: Critical (Fix immediately)
1. `001-import-loading-state-stuck.md` - UI stuck in "Importing..." on failure
2. `002-create-workspace-orphaned-data.md` - Orphaned workspace records
3. `003-invite-modal-race-condition.md` - Double-submit causes multiple invites

### Phase 2: High Priority (Fix soon)
1. `001-unsafe-type-casting.md` - Runtime null errors from Supabase responses
2. `002-unhandled-async-errors.md` - Silent failures in rename/switch operations
3. `003-silent-auth-errors.md` - Network failures show empty lists

### Phase 3: Improvements (When convenient)
1. `001-layer-violation-direct-supabase.md` - Components calling Supabase directly
2. `002-weak-email-validation.md` - Malformed emails pass validation
3. `003-dead-noop-functions.md` - Stub functions that crash if called
4. `004-partial-import-no-rollback.md` - Partial imports lose data
5. `005-accept-invite-inconsistent-state.md` - Failed invite deletion leaves bad state

## Notes

- Each fix should be committed separately
- Run `npm test` after each change
- Layer violations (Phase 3) are the biggest architectural debt
