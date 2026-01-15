# Agent List Component

## Context

Display the list of agents in the left sidebar. Clicking an agent selects it for editing.

## Acceptance Criteria

- [ ] Render list of agent names from app state
- [ ] Show "No agents yet" message when list is empty
- [ ] Clicking an agent row calls `selectAgent(id)`
- [ ] Visually highlight the currently selected agent
- [ ] List is scrollable if many agents
- [ ] Agent names truncate with ellipsis if too long

## Out of Scope

- Drag-and-drop reordering
- Search/filter agents
- Agent grouping or categorization

## Notes

Keep the component simple - just displays agents and handles selection. Add/edit/delete UI comes in subsequent tasks.
