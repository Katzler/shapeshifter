# Create App State Store

## Context

Implement a React Context that holds the application state and provides actions to modify it. Changes auto-persist to LocalStorage.

## Acceptance Criteria

- [ ] Create `AppContext` with current state and action functions
- [ ] Load initial state from storage on app start (or create empty state)
- [ ] Auto-save to storage whenever state changes
- [ ] Provide actions (functions in context):
  - `addAgent(name: string): Agent` - create new agent with default preferences
  - `renameAgent(id: string, name: string): void`
  - `deleteAgent(id: string): void`
  - `setPreference(agentId: string, day: DayOfWeek, shift: ShiftId, status: PreferenceStatus): void`
  - `cyclePreference(agentId: string, day: DayOfWeek, shift: ShiftId): void` - cycle to next status
- [ ] Selected agent state: `selectedAgentId: string | null`
- [ ] `selectAgent(id: string | null): void` action
- [ ] Generate unique IDs for new agents (simple approach: timestamp or crypto.randomUUID)

## Out of Scope

- Undo/redo functionality
- Optimistic updates or complex state machines
- Derived state / selectors (keep it simple)

## Notes

Use `useReducer` or simple `useState` - avoid external state libraries. The context should be straightforward to understand and modify.
