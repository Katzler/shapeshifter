# Grid Integration

## Context

Wire up the grid to the app state so edits persist and reflect immediately.

## Acceptance Criteria

- [ ] Grid reads preferences from the selected agent's data
- [ ] Cell clicks call `cyclePreference(agentId, day, shift)`
- [ ] Grid updates immediately when state changes (no refresh needed)
- [ ] Switching between agents loads correct preferences
- [ ] Changes persist to LocalStorage (verify by page reload)
- [ ] No UI lag when rapidly clicking multiple cells

## Out of Scope

- Batch editing mode
- Optimistic updates with rollback
- Conflict resolution

## Notes

The single-user, local-only nature means we don't need to handle sync issues. Just keep the UI snappy.
