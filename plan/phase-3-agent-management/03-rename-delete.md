# Rename & Delete Agent

## Context

Allow editing agent names and removing agents from the list.

## Acceptance Criteria

### Rename
- [ ] Double-click on agent name (or click edit icon) enters edit mode
- [ ] Edit mode shows input field with current name selected
- [ ] Enter confirms the rename
- [ ] Escape cancels and reverts to original name
- [ ] Empty names are not allowed

### Delete
- [ ] Delete button/icon visible on agent row (or in context menu)
- [ ] Clicking delete shows a simple confirmation (can be inline, e.g., "Delete? Yes / No")
- [ ] Confirming removes the agent and all their preferences
- [ ] If deleted agent was selected, selection clears (no agent selected)
- [ ] Deleting last agent results in empty list state

## Out of Scope

- Undo delete
- Soft delete / archive
- Bulk delete

## Notes

Make destructive actions require confirmation but keep it lightweight - avoid heavy modal dialogs.
