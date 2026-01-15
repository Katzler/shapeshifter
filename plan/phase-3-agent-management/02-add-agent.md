# Add Agent Flow

## Context

Allow users to add new agents to the team.

## Acceptance Criteria

- [ ] "Add Agent" button visible in the sidebar (below or above the list)
- [ ] Clicking opens an inline input field (not a modal)
- [ ] User types name and presses Enter to confirm
- [ ] Pressing Escape cancels the add operation
- [ ] Empty names are not allowed (disable confirm or show validation)
- [ ] New agent is added with all preferences set to "neutral"
- [ ] New agent is automatically selected after creation
- [ ] Input field auto-focuses when opened

## Out of Scope

- Duplicate name checking
- Name length limits
- Batch import of agents

## Notes

Keep the interaction fast - minimize clicks. The inline approach avoids modal overhead.
